'use client';
import { getCalApi } from '@calcom/embed-react';
import { useEffect, useRef } from 'react';

interface CalBookingEmbedProps {
  calLink: string;
  onBookingSuccess: (data: { startTime: string; endTime: string; uid: string }) => void;
}

export function CalBookingEmbed({ calLink, onBookingSuccess }: CalBookingEmbedProps) {
  const onSuccessRef = useRef(onBookingSuccess);
  onSuccessRef.current = onBookingSuccess;

  useEffect(() => {
    getCalApi().then((cal) => {
      cal('inline', {
        elementOrSelector: '#cal-booking-inline',
        calLink,
        config: { layout: 'month_view' },
      });
      cal('on', {
        action: 'bookingSuccessful',
        callback: (e: any) => {
          const d = e.detail?.data;
          onSuccessRef.current({
            startTime: d?.startTime ?? '',
            endTime: d?.endTime ?? '',
            uid: d?.uid ?? '',
          });
        },
      });
    });
  }, [calLink]);

  return <div id="cal-booking-inline" style={{ width: '100%', minHeight: 600 }} />;
}
