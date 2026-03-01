import mongoose, { Schema } from 'mongoose';

await mongoose.connect('mongodb://localhost:27018/mentor-app');

const EmailTemplateModel = mongoose.model('EmailTemplate', new Schema(
    { name: String, subject: String, bodyHtml: String },
    { timestamps: true }
));

const templates = [
    {
        name: '🎓 Mentor Recruitment',
        subject: 'Share your expertise — become a mentor on OWL Mentor',
        bodyHtml: '<p>We\'re building a community of world-class mentors, and we\'d love to have you on board.</p>\n\n<p>Whether you\'re a seasoned professional, an entrepreneur, or a specialist in your field, <strong>your experience can change someone\'s career trajectory</strong>.</p>\n\n<p>As an OWL Mentor mentor, you can:</p>\n<ul style="margin:12px 0;padding-left:20px;line-height:2;">\n  <li>Set your own schedule and hourly rate</li>\n  <li>Connect with motivated mentees globally</li>\n  <li>Build your personal brand and network</li>\n  <li>Make a real impact — one session at a time</li>\n</ul>\n\n<p>Getting started takes less than 10 minutes. Join hundreds of mentors already making a difference.</p>',
    },
    {
        name: '🚀 Mentee Acquisition',
        subject: 'Accelerate your career with 1-on-1 mentorship',
        bodyHtml: '<p>What if you could learn directly from someone who\'s already achieved what you\'re working toward?</p>\n\n<p>At <strong>OWL Mentor</strong>, we connect ambitious professionals and students with expert mentors who provide real, actionable guidance — not just generic advice.</p>\n\n<p>Here\'s what you get:</p>\n<ul style="margin:12px 0;padding-left:20px;line-height:2;">\n  <li>1-on-1 sessions tailored to your specific goals</li>\n  <li>Access to mentors across tech, business, design, and more</li>\n  <li>Flexible scheduling that fits your calendar</li>\n  <li>Honest, experienced feedback to fast-track your growth</li>\n</ul>\n\n<p>Your breakthrough moment is one conversation away. Browse mentors today and book your first session.</p>',
    },
    {
        name: '📣 Platform Launch Announcement',
        subject: 'OWL Mentor is live — your mentorship journey starts now',
        bodyHtml: '<p>We\'re thrilled to announce that <strong>OWL Mentor is officially live</strong>! 🎉</p>\n\n<p>After months of building and refining, our platform is ready to help you connect with world-class mentors — or start mentoring others yourself.</p>\n\n<p><strong>What makes OWL Mentor different?</strong></p>\n<ul style="margin:12px 0;padding-left:20px;line-height:2;">\n  <li>Verified, experienced mentors in top fields</li>\n  <li>Transparent pricing — no hidden fees</li>\n  <li>Easy scheduling with built-in reminders</li>\n  <li>Growing community of learners and leaders</li>\n</ul>\n\n<p>As an early member, you\'ll be part of something special. We\'re working hard every day to make this the best mentorship platform in the world.</p>\n\n<p><em>Ready to get started? Choose your path below.</em></p>',
    },
    {
        name: '💼 B2B / Corporate Outreach',
        subject: 'Invest in your team growth with OWL Mentor',
        bodyHtml: '<p>High-performing teams don\'t just happen — they\'re built through continuous learning and great mentorship.</p>\n\n<p><strong>OWL Mentor for Teams</strong> gives your employees access to expert mentors who can help them level up their skills, navigate career transitions, and unlock their full potential.</p>\n\n<p>Why leading companies are choosing OWL Mentor:</p>\n<ul style="margin:12px 0;padding-left:20px;line-height:2;">\n  <li>Improve retention by investing in employee development</li>\n  <li>Access mentors across 50+ specializations</li>\n  <li>Track progress and session history</li>\n  <li>Flexible plans that scale with your team</li>\n</ul>\n\n<p>Let\'s talk about how OWL Mentor can support your team\'s journey. We\'d love to set up a quick call.</p>',
    },
    {
        name: '🔁 Re-engagement Campaign',
        subject: 'We miss you — here is what is new on OWL Mentor',
        bodyHtml: '<p>It\'s been a while, and we wanted to reach out personally.</p>\n\n<p>A lot has happened on OWL Mentor recently, and we think you\'ll be excited to see what\'s new:</p>\n<ul style="margin:12px 0;padding-left:20px;line-height:2;">\n  <li>New mentors added across high-demand fields</li>\n  <li>Improved scheduling and session tools</li>\n  <li>Expanded mentor profiles with video intros</li>\n  <li>A growing, supportive community</li>\n</ul>\n\n<p>Whether you\'re ready to book your next mentoring session or finally take the leap and become a mentor yourself, now is a great time to come back.</p>\n\n<p>We\'re here to support your growth — at every stage of your journey.</p>',
    },
];

let created = 0;
let skipped = 0;

for (const t of templates) {
    const exists = await EmailTemplateModel.findOne({ name: t.name });
    if (exists) {
        console.log(`⏭  Skipped (already exists): ${t.name}`);
        skipped++;
    } else {
        await EmailTemplateModel.create(t);
        console.log(`✅ Created: ${t.name}`);
        created++;
    }
}

console.log(`\nDone — ${created} created, ${skipped} skipped.`);
await mongoose.disconnect();
