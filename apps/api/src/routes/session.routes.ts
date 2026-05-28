import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireEmailVerified } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { MeetingRepository, MentorRepository, UserRepository } from '@owl-mentors/database';
import { LiveKitService } from '../services/livekit.service';

const router: Router = Router();
const meetingRepo = new MeetingRepository();
const mentorRepo = new MentorRepository();
const userRepo = new UserRepository();
const livekitService = new LiveKitService();

// GET /api/sessions/:id/token
router.get('/sessions/:id/token', authenticate, requireEmailVerified, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const meeting = await meetingRepo.findById(req.params.id);

    let isParticipant = meeting.menteeId === req.userId;
    if (!isParticipant) {
      const mentor = await mentorRepo.findById(meeting.mentorId);
      isParticipant = mentor.userId === req.userId;
    }
    if (!isParticipant) {
      throw new AppError(403, 'FORBIDDEN', 'You are not allowed to join this session');
    }

    if (!meeting.livekitRoomName) {
      throw new AppError(409, 'ROOM_NOT_READY', 'LiveKit room is not ready for this session yet');
    }

    const isMentor = meeting.menteeId !== req.userId;
    const user = await userRepo.findById(req.userId!);
    const token = await livekitService.generateToken({
      roomName: meeting.livekitRoomName,
      participantIdentity: req.userId!,
      participantName: user.name || 'Participant',
      isHost: isMentor,
    });

    res.json({
      success: true,
      data: {
        token,
        serverUrl: livekitService.getServerUrl(),
        roomName: meeting.livekitRoomName,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
