'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TermsAcceptanceModalProps {
    open: boolean;
    onAccept: () => void;
}

export function TermsAcceptanceModal({ open, onAccept }: TermsAcceptanceModalProps) {
    const [accepted, setAccepted] = useState(false);

    if (!open) return null;

    const h2 = 'text-base font-bold text-white mt-6 mb-2';
    const p = 'text-slate-300 text-sm leading-relaxed';
    const li = 'text-slate-300 text-sm';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col"
                style={{ maxHeight: '88vh' }}
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-700/60 shrink-0">
                    <h2 className="text-xl font-bold text-white">Independent Contractor Agreement</h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Blu Codes Inc. (Operating as Owl Mentors) &mdash; Effective March 1st, 2026
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                        Please read the entire agreement below before proceeding with your mentor profile.
                    </p>
                </div>

                {/* Scrollable agreement content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 space-y-1">
                    <p className={p}>
                        This Independent Contractor Agreement (&ldquo;Agreement&rdquo;) is entered into by and between{' '}
                        <strong className="text-white">Blu Codes Inc.</strong>, operating as Owl Mentors, a corporation
                        duly incorporated under the laws of Canada (&ldquo;Company&rdquo;, &ldquo;Owl Mentors&rdquo;),
                        AND the undersigned Instructor (&ldquo;Instructor&rdquo;, &ldquo;Contractor&rdquo;).
                        Collectively referred to as the &ldquo;Parties.&rdquo;
                    </p>

                    <h3 className={h2}>1. Nature of Relationship</h3>
                    <p className={p}>1.1 Instructor is engaged as an independent contractor.</p>
                    <p className={p}>1.2 Nothing herein creates employment, partnership, franchise, agency, fiduciary, or joint venture relationship.</p>
                    <p className={p}>1.3 Instructor has no authority to bind the Company.</p>
                    <p className={p}>1.4 Instructor is solely responsible for:</p>
                    <ul className="list-disc list-inside ml-4 space-y-0.5">
                        <li className={li}>All global taxes</li>
                        <li className={li}>Social security obligations</li>
                        <li className={li}>Employment contributions</li>
                        <li className={li}>Work permits/visa compliance</li>
                        <li className={li}>Insurance coverage</li>
                    </ul>
                    <p className={p}>1.5 Instructor waives any claim to employee benefits, overtime, severance, vacation pay, pension, or equity rights.</p>

                    <h3 className={h2}>2. Global Compliance</h3>
                    <p className={p}>2.1 Instructor warrants compliance with all applicable laws in their country of residence, including labor laws, tax regulations, data protection laws, child safeguarding laws, export control laws, and anti-bribery laws.</p>
                    <p className={p}>2.2 Instructor is solely responsible for ensuring legal eligibility to provide services cross-border.</p>

                    <h3 className={h2}>3. Services</h3>
                    <p className={p}>3.1 Instructor shall provide online educational services as assigned. Company may assign, remove, or reassign students at its sole discretion. No minimum hours, income, or exclusivity is guaranteed. Company may modify curriculum, pricing, or service structure at any time.</p>

                    <h3 className={h2}>4. Payment Terms</h3>
                    <p className={p}>4.1 Compensation shall be per session/hour as agreed separately. Payment is conditional upon completed sessions, proper documentation, compliance with policies, and no breach of Agreement. Company may withhold payment for misconduct, policy violations, fraud, or chargebacks. Instructor bears all banking, transfer, and currency conversion fees.</p>

                    <h3 className={h2}>5. Non-Solicitation &amp; Non-Circumvention (Global)</h3>
                    <p className={p}>5.1 Instructor shall not directly or indirectly solicit students or parents introduced by Owl Mentors, offer competing services, divert clients, or recruit other instructors. This applies worldwide during the term and for 36 months after termination. Breach results in immediate termination, liquidated damages of USD $10,000 per incident, injunctive relief, and recovery of legal costs.</p>

                    <h3 className={h2}>6. Non-Compete (Where Legally Enforceable)</h3>
                    <p className={p}>To the maximum extent permitted by applicable law, Instructor shall not provide substantially similar services to competing online mentorship platforms serving Company-introduced clients for 12 months post-termination.</p>

                    <h3 className={h2}>7. Confidentiality (Perpetual)</h3>
                    <p className={p}>Instructor shall keep confidential all student information, parent contact data, pricing, business strategies, technology systems, internal policies, marketing plans, and trade secrets. This obligation survives indefinitely.</p>

                    <h3 className={h2}>8. Data Protection &amp; International Privacy</h3>
                    <p className={p}>8.1 Instructor agrees to comply with GDPR (EU), UK GDPR, COPPA (USA), PIPEDA (Canada), and all applicable local child privacy laws.</p>
                    <p className={p}>8.2 Instructor shall not download student data, store data outside approved systems, or transfer data across borders without authorization. Any data breaches must be immediately reported.</p>
                    <p className={p}>8.3 Instructor shall indemnify Company for privacy violations caused by Instructor.</p>

                    <h3 className={h2}>9. Intellectual Property (Global Assignment)</h3>
                    <p className={p}>All materials created during engagement are &ldquo;work made for hire.&rdquo; Instructor irrevocably assigns worldwide intellectual property rights to Blu Codes Inc. and waives moral rights to the extent permitted by law. Company retains ownership of curriculum, brand assets, recordings, systems, software, and trademarks.</p>

                    <h3 className={h2}>10. Recordings &amp; Consent</h3>
                    <p className={p}>Instructor consents to session recording, monitoring, AI quality analysis, and use of anonymized content for training. Company owns all recordings globally.</p>

                    <h3 className={h2}>11. Representations &amp; Warranties</h3>
                    <p className={p}>Instructor warrants that all credentials are accurate, they have no criminal background involving minors, no pending legal restriction preventing teaching, and services will be professional and lawful. False representation is grounds for immediate termination and damages.</p>

                    <h3 className={h2}>12. Limitation of Liability</h3>
                    <p className={p}>To the maximum extent permitted by law, Company shall not be liable for indirect damages, loss of income, reputation harm, emotional distress, or regulatory fines. Maximum liability shall not exceed total fees paid to Instructor in the 30 days preceding the claim.</p>

                    <h3 className={h2}>13. Indemnification</h3>
                    <p className={p}>Instructor shall indemnify, defend, and hold harmless Blu Codes Inc., its directors, officers, shareholders, affiliates, and agents from claims arising from Instructor negligence, breach of Agreement, misrepresentation, harassment, IP infringement, tax claims, data breaches, or cross-border legal violations. This obligation survives termination.</p>

                    <h3 className={h2}>14. Insurance</h3>
                    <p className={p}>Company may require Instructor to maintain professional liability insurance. Failure to maintain required insurance may result in suspension.</p>

                    <h3 className={h2}>15. Termination</h3>
                    <p className={p}>15.1 Company may terminate at any time, with or without cause. Immediate termination may occur for student solicitation, inappropriate conduct, legal violations, or reputation damage. No compensation is owed post-termination except for approved completed sessions.</p>

                    <h3 className={h2}>16. Force Majeure</h3>
                    <p className={p}>Company is not liable for failure due to natural disasters, war, pandemics, government actions, internet failures, or payment processor issues.</p>

                    <h3 className={h2}>17. Dispute Resolution (Mandatory Vancouver, BC)</h3>
                    <p className={p}>This Agreement is governed exclusively by the laws of British Columbia, Canada. Disputes shall be resolved exclusively in Vancouver, BC through binding arbitration under BCICAC rules, conducted in English. Instructor irrevocably waives any objection to jurisdiction and agrees not to participate in class action proceedings.</p>

                    <h3 className={h2}>18. Severability</h3>
                    <p className={p}>If any provision is unenforceable, it shall be modified to the maximum enforceable extent without affecting remaining provisions.</p>

                    <h3 className={h2}>19. Entire Agreement</h3>
                    <p className={p}>This Agreement supersedes all prior communications and constitutes the full understanding between Parties.</p>

                    <h3 className={h2}>20. Survival of Provisions</h3>
                    <p className={p}>Confidentiality, IP Assignment, Non-Solicitation, Non-Compete (where enforceable), Indemnification, Limitation of Liability, Arbitration, Payment Clawback, Reputation Protection, Non-Disparagement, Waivers, Governing Law, Data Protection, and Sanctions Compliance survive termination indefinitely.</p>

                    <h3 className={h2}>21. Arbitration Confidentiality</h3>
                    <p className={p}>All arbitration proceedings are strictly confidential. Parties agree not to disclose the nature of any dispute, amounts claimed, settlement discussions, or outcomes, except as required by law, legal counsel, or award enforcement.</p>

                    <h3 className={h2}>22. Mandatory Background Screening</h3>
                    <p className={p}>Instructor agrees to undergo criminal record checks, identity verification, credential verification, reference checks, and child abuse registry checks at Company&apos;s discretion. Instructor warrants no convictions involving minors and legal permission to work with children. Failure to pass or misrepresentation results in immediate termination without compensation.</p>

                    <h3 className={h2}>23. AI Usage Disclosure &amp; Consent</h3>
                    <p className={p}>Company may use AI for session monitoring, quality assurance, analytics, scheduling, fraud detection, and content moderation. Instructor consents to AI-assisted monitoring. Instructor shall not use AI in ways that violate privacy laws, replace live teaching without disclosure, or generate misleading academic work for students.</p>

                    <h3 className={h2}>24. Cybersecurity Compliance</h3>
                    <p className={p}>Instructor shall maintain updated antivirus software, secure internet connection, password protection, and multi-factor authentication. Instructor shall not share login credentials, use unsecured public networks without VPN, or store student data locally. Any suspected breach must be reported within 24 hours.</p>

                    <h3 className={h2}>25. Export Control Compliance</h3>
                    <p className={p}>Instructor agrees to comply with all applicable export control and trade regulations, including Canadian export laws, U.S. EAR, and international trade restrictions. Instructor shall not provide services to restricted or embargoed countries and represents they do not reside in a sanctioned jurisdiction.</p>

                    <h3 className={h2}>26. OFAC &amp; Sanctions Compliance</h3>
                    <p className={p}>Instructor represents they are not listed on any OFAC, Canadian, or UN sanctions list. Company may immediately suspend or terminate if sanctions risk is identified. Instructor shall indemnify Company for any penalties from Instructor&apos;s sanctions violations.</p>

                    <h3 className={h2}>27. Payment Clawback</h3>
                    <p className={p}>Company may claw back previously paid compensation in cases of fraud, student solicitation, misconduct, chargebacks, breach of non-circumvention, or misrepresentation. Clawback may occur via deduction, direct reimbursement demand, or legal recovery. Company may suspend payment pending investigation.</p>

                    <h3 className={h2}>28. Reputation Protection</h3>
                    <p className={p}>Instructor shall not engage in conduct that may harm the reputation, goodwill, or public image of Blu Codes Inc. or Owl Mentors, including public complaints, social media criticism, negative media engagement, or disparaging marketing.</p>

                    <h3 className={h2}>29. Defamation &amp; Non-Disparagement</h3>
                    <p className={p}>Instructor agrees not to make false, misleading, or defamatory statements about the Company, its directors, employees, students, or business operations during engagement and indefinitely after termination. Breach entitles Company to immediate termination, injunctive relief, monetary damages, and recovery of legal fees.</p>

                    <h3 className={h2}>30. Mandatory Professional Conduct Training</h3>
                    <p className={p}>Instructor agrees to complete mandatory training including child safeguarding, professional conduct, anti-harassment, data privacy, cybersecurity awareness, and AI usage compliance within timeframes specified by the Company. Failure may result in suspension, withholding of assignments, or termination.</p>

                    <h3 className={h2}>31. Waiver of Moral Damages</h3>
                    <p className={p}>To the maximum extent permitted by law, Instructor irrevocably waives any right to claim moral damages, reputational damages, emotional distress damages, or similar non-economic damages arising from termination, suspension, student reassignment, performance reviews, AI monitoring, or policy enforcement. This waiver applies globally and survives termination.</p>

                    <h3 className={h2}>32. Waiver of Punitive &amp; Exemplary Damages</h3>
                    <p className={p}>To the fullest extent permitted by law, Instructor waives any right to recover punitive damages, exemplary damages, treble damages, or statutory penalties beyond actual proven damages.</p>

                    <h3 className={h2}>33. Forum Selection Supremacy Clause</h3>
                    <p className={p}>The dispute resolution provisions supersede any conflicting law. Vancouver, British Columbia, Canada is the exclusive forum. No foreign court shall have jurisdiction. Instructor waives any right to claim Vancouver is an inconvenient forum, regardless of country of residence.</p>

                    <h3 className={h2}>34. Governing Language</h3>
                    <p className={p}>This Agreement is drafted in English. If translated, the English version prevails. Instructor acknowledges understanding of the English language and waives any claim based on translation interpretation.</p>

                    <p className="text-slate-600 text-xs mt-6">Blu Codes Inc. operating as Owl Mentors. Copyright 2026</p>
                </div>

                {/* Footer: view link + checkbox + accept button */}
                <div className="px-6 py-5 border-t border-slate-700/60 shrink-0 space-y-4 bg-slate-900/80">
                    <p className="text-xs text-slate-500">
                        You can also{' '}
                        <Link href="/terms" target="_blank" className="text-brand-light hover:text-brand-light underline underline-offset-2">
                            view the full agreement in a new tab
                        </Link>
                        .
                    </p>
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 shrink-0 rounded border-slate-600 bg-slate-800 accent-brand cursor-pointer"
                        />
                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                            I have read, understood, and agree to the Independent Contractor Agreement above.
                        </span>
                    </label>
                    <Button
                        disabled={!accepted}
                        onClick={onAccept}
                        className="w-full bg-brand hover:bg-brand text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Accept &amp; Continue
                    </Button>
                </div>
            </div>
        </div>
    );
}
