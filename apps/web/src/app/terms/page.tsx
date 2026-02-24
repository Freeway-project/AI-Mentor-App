import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
    const headingCls = 'text-xl font-bold text-white mt-8 mb-3';
    const textCls = 'text-slate-300 leading-relaxed';
    const listCls = 'list-disc list-inside space-y-1 text-slate-300 ml-4';

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1117 30%, #0f0b1e 60%, #0a0e1a 100%)' }}>
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle, #475569 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
            </div>
            <Navbar />
            <div className="flex-1 container mx-auto px-4 py-20 relative z-10">
                <div className="max-w-3xl mx-auto bg-slate-900/40 backdrop-blur-md border border-slate-800/80 p-8 md:p-12 rounded-2xl shadow-xl">
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Independent Contractor Agreement</h1>
                    <p className="text-slate-400 mb-1">Blu Codes Inc. (Operating as Owl Mentors)</p>
                    <p className="text-slate-500 text-sm mb-8">Effective Date: March 1st, 2026</p>

                    <p className={textCls}>
                        This Independent Contractor Agreement (&ldquo;Agreement&rdquo;) is entered into by and between:
                        <strong className="text-white"> Blu Codes Inc.</strong>, operating as Owl Mentors, a corporation duly incorporated under the laws of Canada
                        (&ldquo;Company&rdquo;, &ldquo;Owl Mentors&rdquo;),
                        AND the undersigned Instructor (&ldquo;Instructor&rdquo;, &ldquo;Contractor&rdquo;).
                        Collectively referred to as the &ldquo;Parties.&rdquo;
                    </p>

                    {/* 1 */}
                    <h2 className={headingCls}>1. Nature of Relationship</h2>
                    <p className={textCls}>1.1 Instructor is engaged as an independent contractor.</p>
                    <p className={`${textCls} mt-2`}>1.2 Nothing herein creates employment, partnership, franchise, agency, fiduciary, or joint venture relationship.</p>
                    <p className={`${textCls} mt-2`}>1.3 Instructor has no authority to bind the Company.</p>
                    <p className={`${textCls} mt-2`}>1.4 Instructor is solely responsible for:</p>
                    <ul className={listCls}>
                        <li>All global taxes</li>
                        <li>Social security obligations</li>
                        <li>Employment contributions</li>
                        <li>Work permits/visa compliance</li>
                        <li>Insurance coverage</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>1.5 Instructor waives any claim to:</p>
                    <ul className={listCls}>
                        <li>Employee benefits</li>
                        <li>Overtime</li>
                        <li>Severance</li>
                        <li>Vacation pay</li>
                        <li>Pension</li>
                        <li>Equity rights</li>
                    </ul>

                    {/* 2 */}
                    <h2 className={headingCls}>2. Global Compliance</h2>
                    <p className={textCls}>2.1 Instructor warrants compliance with all applicable laws in their country of residence, including:</p>
                    <ul className={listCls}>
                        <li>Labor laws</li>
                        <li>Tax regulations</li>
                        <li>Data protection laws</li>
                        <li>Child safeguarding laws</li>
                        <li>Export control laws</li>
                        <li>Anti-bribery and corruption laws</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>2.2 Instructor is solely responsible for ensuring legal eligibility to provide services cross-border.</p>

                    {/* 3 */}
                    <h2 className={headingCls}>3. Services</h2>
                    <p className={textCls}>3.1 Instructor shall provide online educational services as assigned.</p>
                    <p className={`${textCls} mt-2`}>3.2 Company may assign, remove, or reassign students at its sole discretion.</p>
                    <p className={`${textCls} mt-2`}>3.3 No minimum hours, income, or exclusivity is guaranteed.</p>
                    <p className={`${textCls} mt-2`}>3.4 Company may modify curriculum, pricing, or service structure at any time.</p>

                    {/* 4 */}
                    <h2 className={headingCls}>4. Payment Terms</h2>
                    <p className={textCls}>4.1 Compensation shall be per session/hour as agreed separately.</p>
                    <p className={`${textCls} mt-2`}>4.2 Payment is conditional upon:</p>
                    <ul className={listCls}>
                        <li>Completed session</li>
                        <li>Proper documentation</li>
                        <li>Compliance with policies</li>
                        <li>No breach of Agreement</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>4.3 Company may withhold payment in cases of:</p>
                    <ul className={listCls}>
                        <li>Misconduct</li>
                        <li>Policy violations</li>
                        <li>Fraud</li>
                        <li>Chargebacks or payment disputes</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>4.4 Instructor bears all banking, transfer, and currency conversion fees.</p>

                    {/* 5 */}
                    <h2 className={headingCls}>5. Non-Solicitation &amp; Non-Circumvention (Global)</h2>
                    <p className={textCls}>5.1 Instructor shall not, directly or indirectly:</p>
                    <ul className={listCls}>
                        <li>Solicit students or parents introduced by Owl Mentors</li>
                        <li>Offer competing services</li>
                        <li>Divert clients</li>
                        <li>Recruit other instructors</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>5.2 Applies worldwide during term and for 36 months after termination.</p>
                    <p className={`${textCls} mt-2`}>5.3 Breach results in:</p>
                    <ul className={listCls}>
                        <li>Immediate termination</li>
                        <li>Liquidated damages of USD $10,000 per incident</li>
                        <li>Injunctive relief</li>
                        <li>Recovery of legal costs</li>
                    </ul>

                    {/* 6 */}
                    <h2 className={headingCls}>6. Non-Compete (Where Legally Enforceable)</h2>
                    <p className={textCls}>
                        To the maximum extent permitted by applicable law, Instructor shall not provide substantially similar
                        services to competing online mentorship platforms serving Company-introduced clients for 12 months
                        post-termination. If unenforceable in a jurisdiction, the clause shall be modified to the maximum enforceable extent.
                    </p>

                    {/* 7 */}
                    <h2 className={headingCls}>7. Confidentiality (Perpetual)</h2>
                    <p className={textCls}>Instructor shall keep confidential all:</p>
                    <ul className={listCls}>
                        <li>Student information</li>
                        <li>Parent contact data</li>
                        <li>Pricing</li>
                        <li>Business strategies</li>
                        <li>Technology systems</li>
                        <li>Internal policies</li>
                        <li>Marketing plans</li>
                        <li>Trade secrets</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>Obligation survives indefinitely.</p>

                    {/* 8 */}
                    <h2 className={headingCls}>8. Data Protection &amp; International Privacy</h2>
                    <p className={textCls}>8.1 Instructor agrees to comply with all applicable international data protection laws including but not limited to:</p>
                    <ul className={listCls}>
                        <li>GDPR (EU)</li>
                        <li>UK GDPR</li>
                        <li>COPPA (USA)</li>
                        <li>PIPEDA (Canada)</li>
                        <li>Any local child privacy law</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>8.2 Instructor shall:</p>
                    <ul className={listCls}>
                        <li>Not download student data</li>
                        <li>Not store data outside approved systems</li>
                        <li>Not transfer data across borders without authorization</li>
                        <li>Immediately report data breaches</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>8.3 Instructor shall indemnify Company for privacy violations caused by Instructor.</p>

                    {/* 9 */}
                    <h2 className={headingCls}>9. Intellectual Property (Global Assignment)</h2>
                    <p className={textCls}>9.1 All materials created during engagement are &ldquo;work made for hire.&rdquo;</p>
                    <p className={`${textCls} mt-2`}>9.2 Instructor irrevocably assigns worldwide intellectual property rights to Blu Codes Inc.</p>
                    <p className={`${textCls} mt-2`}>9.3 Instructor waives moral rights to the extent permitted by law.</p>
                    <p className={`${textCls} mt-2`}>9.4 Company retains ownership of:</p>
                    <ul className={listCls}>
                        <li>Curriculum</li>
                        <li>Brand assets</li>
                        <li>Recordings</li>
                        <li>Systems</li>
                        <li>Software</li>
                        <li>Trademarks</li>
                    </ul>

                    {/* 10 */}
                    <h2 className={headingCls}>10. Recordings &amp; Consent</h2>
                    <p className={textCls}>Instructor consents to:</p>
                    <ul className={listCls}>
                        <li>Session recording</li>
                        <li>Monitoring</li>
                        <li>AI quality analysis</li>
                        <li>Use of anonymized content for training</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>Company owns all recordings globally.</p>

                    {/* 11 */}
                    <h2 className={headingCls}>11. Representations &amp; Warranties</h2>
                    <p className={textCls}>Instructor warrants that:</p>
                    <ul className={listCls}>
                        <li>All credentials are accurate</li>
                        <li>No criminal background involving minors</li>
                        <li>No pending legal restriction preventing teaching</li>
                        <li>Services will be professional and lawful</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>False representation is grounds for immediate termination and damages.</p>

                    {/* 12 */}
                    <h2 className={headingCls}>12. Limitation of Liability</h2>
                    <p className={textCls}>To the maximum extent permitted by law, Company shall not be liable for:</p>
                    <ul className={listCls}>
                        <li>Indirect damages</li>
                        <li>Loss of income</li>
                        <li>Reputation harm</li>
                        <li>Emotional distress</li>
                        <li>Regulatory fines in Instructor&apos;s country</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>Maximum liability shall not exceed total fees paid to Instructor in the 30 days preceding the claim.</p>

                    {/* 13 */}
                    <h2 className={headingCls}>13. Indemnification (Strong Global Protection)</h2>
                    <p className={textCls}>
                        Instructor shall indemnify, defend, and hold harmless Blu Codes Inc., its directors, officers, shareholders,
                        affiliates, and agents from any claims arising out of:
                    </p>
                    <ul className={listCls}>
                        <li>Instructor negligence</li>
                        <li>Breach of Agreement</li>
                        <li>Misrepresentation</li>
                        <li>Harassment or misconduct</li>
                        <li>IP infringement</li>
                        <li>Tax claims</li>
                        <li>Data breaches</li>
                        <li>Cross-border legal violations</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>This obligation survives termination.</p>

                    {/* 14 */}
                    <h2 className={headingCls}>14. Insurance</h2>
                    <p className={textCls}>Company may require Instructor to maintain professional liability insurance.</p>
                    <p className={`${textCls} mt-2`}>Failure to maintain required insurance may result in suspension.</p>

                    {/* 15 */}
                    <h2 className={headingCls}>15. Termination</h2>
                    <p className={textCls}>15.1 Company may terminate at any time, with or without cause.</p>
                    <p className={`${textCls} mt-2`}>15.2 Immediate termination for:</p>
                    <ul className={listCls}>
                        <li>Student solicitation</li>
                        <li>Inappropriate conduct</li>
                        <li>Legal violations</li>
                        <li>Reputation damage</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>15.3 No compensation is owed post-termination except for approved completed sessions.</p>

                    {/* 16 */}
                    <h2 className={headingCls}>16. Force Majeure</h2>
                    <p className={textCls}>Company is not liable for failure due to:</p>
                    <ul className={listCls}>
                        <li>Natural disasters</li>
                        <li>War</li>
                        <li>Pandemics</li>
                        <li>Government actions</li>
                        <li>Internet failures</li>
                        <li>Payment processor issues</li>
                    </ul>

                    {/* 17 */}
                    <h2 className={headingCls}>17. Dispute Resolution (Mandatory Vancouver, BC)</h2>
                    <p className={textCls}>
                        17.1 This Agreement shall be governed exclusively by the laws of British Columbia, Canada, without regard to conflict of law principles.
                    </p>
                    <p className={`${textCls} mt-2`}>17.2 Any dispute, claim, or controversy arising out of or relating to this Agreement shall be:</p>
                    <ul className={listCls}>
                        <li>Resolved exclusively in Vancouver, British Columbia, Canada</li>
                        <li>Subject to binding arbitration under the rules of the British Columbia International Commercial Arbitration Centre (BCICAC)</li>
                        <li>Conducted in English</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>17.3 Instructor irrevocably waives:</p>
                    <ul className={listCls}>
                        <li>Any objection to jurisdiction</li>
                        <li>Any claim of inconvenient forum</li>
                        <li>Any right to bring claims in another country</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>17.4 Instructor agrees not to participate in class action or collective proceedings.</p>

                    {/* 18 */}
                    <h2 className={headingCls}>18. Severability</h2>
                    <p className={textCls}>
                        If any provision is unenforceable, it shall be modified to the maximum enforceable extent, without affecting remaining provisions.
                    </p>

                    {/* 19 */}
                    <h2 className={headingCls}>19. Entire Agreement</h2>
                    <p className={textCls}>
                        This Agreement supersedes all prior communications and constitutes full understanding between Parties.
                    </p>

                    {/* 20 */}
                    <h2 className={headingCls}>20. Survival of Provisions</h2>
                    <p className={textCls}>The following sections shall survive termination or expiration of this Agreement indefinitely:</p>
                    <ul className={listCls}>
                        <li>Confidentiality</li>
                        <li>Intellectual Property Assignment</li>
                        <li>Non-Solicitation &amp; Non-Circumvention</li>
                        <li>Non-Compete (where enforceable)</li>
                        <li>Indemnification</li>
                        <li>Limitation of Liability</li>
                        <li>Arbitration &amp; Dispute Resolution</li>
                        <li>Arbitration Confidentiality</li>
                        <li>Payment Clawback</li>
                        <li>Reputation Protection</li>
                        <li>Defamation &amp; Non-Disparagement</li>
                        <li>Waiver of Moral Damages</li>
                        <li>Waiver of Punitive Damages</li>
                        <li>Governing Law &amp; Forum Selection</li>
                        <li>Data Protection Obligations</li>
                        <li>Sanctions &amp; Export Compliance</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>Survival shall apply regardless of the reason for termination.</p>

                    {/* 21 */}
                    <h2 className={headingCls}>21. Arbitration Confidentiality</h2>
                    <p className={textCls}>
                        21.1 Any arbitration proceedings, including their existence, filings, evidence, testimony, rulings, and awards, shall be strictly confidential.
                    </p>
                    <p className={`${textCls} mt-2`}>21.2 The Parties agree not to disclose:</p>
                    <ul className={listCls}>
                        <li>The nature of the dispute</li>
                        <li>The amount claimed</li>
                        <li>Settlement discussions</li>
                        <li>Arbitration outcomes</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>Except where disclosure is required by law, to legal counsel, or for enforcement of the award.</p>
                    <p className={`${textCls} mt-2`}>
                        21.3 Breach of this confidentiality obligation shall constitute material breach and entitle Company to injunctive relief and damages.
                    </p>

                    {/* 22 */}
                    <h2 className={headingCls}>22. Mandatory Background Screening</h2>
                    <p className={textCls}>22.1 Instructor agrees to undergo background verification at Company&apos;s discretion, including but not limited to:</p>
                    <ul className={listCls}>
                        <li>Criminal record check</li>
                        <li>Identity verification</li>
                        <li>Credential verification</li>
                        <li>Reference checks</li>
                        <li>Child abuse registry check (where applicable)</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>22.2 Instructor authorizes Company to obtain such reports globally.</p>
                    <p className={`${textCls} mt-2`}>22.3 Instructor represents and warrants that:</p>
                    <ul className={listCls}>
                        <li>They have no convictions involving minors</li>
                        <li>They are legally permitted to work with children</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>
                        22.4 Failure to pass background screening or misrepresentation shall result in immediate termination without notice or compensation.
                    </p>

                    {/* 23 */}
                    <h2 className={headingCls}>23. AI Usage Disclosure &amp; Consent</h2>
                    <p className={textCls}>23.1 Company may use artificial intelligence systems for:</p>
                    <ul className={listCls}>
                        <li>Session monitoring</li>
                        <li>Quality assurance</li>
                        <li>Performance analytics</li>
                        <li>Scheduling</li>
                        <li>Fraud detection</li>
                        <li>Content moderation</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>23.2 Instructor consents to AI-assisted monitoring and analysis of sessions and communications.</p>
                    <p className={`${textCls} mt-2`}>23.3 Instructor shall not use AI tools in a manner that:</p>
                    <ul className={listCls}>
                        <li>Violates privacy laws</li>
                        <li>Replaces live teaching without disclosure</li>
                        <li>Generates misleading academic work for students</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>23.4 Company may implement AI-driven compliance monitoring without prior notice.</p>

                    {/* 24 */}
                    <h2 className={headingCls}>24. Cybersecurity Compliance</h2>
                    <p className={textCls}>24.1 Instructor shall maintain reasonable cybersecurity safeguards including:</p>
                    <ul className={listCls}>
                        <li>Updated antivirus software</li>
                        <li>Secure internet connection</li>
                        <li>Password protection</li>
                        <li>Multi-factor authentication where available</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>24.2 Instructor shall not:</p>
                    <ul className={listCls}>
                        <li>Share login credentials</li>
                        <li>Use unsecured public networks without VPN</li>
                        <li>Store student data locally</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>24.3 Any suspected breach must be reported within 24 hours.</p>
                    <p className={`${textCls} mt-2`}>24.4 Instructor shall be liable for damages arising from negligence in data protection.</p>

                    {/* 25 */}
                    <h2 className={headingCls}>25. Export Control Compliance</h2>
                    <p className={textCls}>25.1 Instructor agrees to comply with all applicable export control and trade regulations including but not limited to:</p>
                    <ul className={listCls}>
                        <li>Canadian export laws</li>
                        <li>U.S. Export Administration Regulations (EAR)</li>
                        <li>International trade restrictions</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>
                        25.2 Instructor shall not provide services, technology, or materials to restricted or embargoed countries in violation of applicable laws.
                    </p>
                    <p className={`${textCls} mt-2`}>
                        25.3 Instructor represents that they are not located in, or ordinarily resident in, any jurisdiction subject to comprehensive trade sanctions.
                    </p>

                    {/* 26 */}
                    <h2 className={headingCls}>26. OFAC &amp; Sanctions Compliance</h2>
                    <p className={textCls}>26.1 Instructor represents that they are not:</p>
                    <ul className={listCls}>
                        <li>Listed on any sanctions list maintained by the U.S. Office of Foreign Assets Control (OFAC)</li>
                        <li>Subject to Canadian sanctions lists</li>
                        <li>Listed by the United Nations sanctions registry</li>
                        <li>Acting on behalf of any sanctioned individual or entity</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>
                        26.2 Company reserves the right to immediately suspend or terminate engagement if sanctions risk is identified.
                    </p>
                    <p className={`${textCls} mt-2`}>
                        26.3 Instructor shall indemnify Company for any penalties arising from Instructor&apos;s sanctions violations.
                    </p>

                    {/* 27 */}
                    <h2 className={headingCls}>27. Payment Clawback</h2>
                    <p className={textCls}>27.1 Company reserves the right to claw back previously paid compensation in cases of:</p>
                    <ul className={listCls}>
                        <li>Fraud</li>
                        <li>Student solicitation</li>
                        <li>Misconduct</li>
                        <li>Chargebacks or refunds</li>
                        <li>Breach of non-circumvention</li>
                        <li>Misrepresentation</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>27.2 Clawback may occur via:</p>
                    <ul className={listCls}>
                        <li>Deduction from future payments</li>
                        <li>Direct reimbursement demand</li>
                        <li>Legal recovery proceedings</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>27.3 Company may suspend payment pending investigation.</p>

                    {/* 28 */}
                    <h2 className={headingCls}>28. Reputation Protection</h2>
                    <p className={textCls}>
                        28.1 Instructor shall not engage in conduct that may reasonably harm the reputation, goodwill, or public image of Blu Codes Inc. or Owl Mentors.
                    </p>
                    <p className={`${textCls} mt-2`}>28.2 This includes but is not limited to:</p>
                    <ul className={listCls}>
                        <li>Public complaints</li>
                        <li>Social media criticism</li>
                        <li>Negative media engagement</li>
                        <li>Disparaging marketing</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>
                        28.3 Company reserves the right to terminate engagement where Instructor conduct may cause reputational harm.
                    </p>

                    {/* 29 */}
                    <h2 className={headingCls}>29. Defamation &amp; Non-Disparagement</h2>
                    <p className={textCls}>29.1 Instructor agrees not to make any false, misleading, or defamatory statements about:</p>
                    <ul className={listCls}>
                        <li>Company</li>
                        <li>Directors or shareholders</li>
                        <li>Employees</li>
                        <li>Students</li>
                        <li>Business operations</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>29.2 This obligation applies during engagement and indefinitely after termination.</p>
                    <p className={`${textCls} mt-2`}>29.3 Breach shall entitle Company to:</p>
                    <ul className={listCls}>
                        <li>Immediate termination</li>
                        <li>Injunctive relief</li>
                        <li>Monetary damages</li>
                        <li>Recovery of legal fees</li>
                    </ul>

                    {/* 30 */}
                    <h2 className={headingCls}>30. Mandatory Professional Conduct Training</h2>
                    <p className={textCls}>30.1 Instructor agrees to complete any mandatory training required by the Company, including but not limited to:</p>
                    <ul className={listCls}>
                        <li>Child safeguarding training</li>
                        <li>Professional conduct standards</li>
                        <li>Anti-harassment training</li>
                        <li>Data privacy compliance</li>
                        <li>Cybersecurity awareness</li>
                        <li>AI usage compliance</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>30.2 Instructor shall complete such training within the timeframe specified by the Company.</p>
                    <p className={`${textCls} mt-2`}>30.3 Failure to complete mandatory training may result in:</p>
                    <ul className={listCls}>
                        <li>Suspension</li>
                        <li>Withholding of session assignments</li>
                        <li>Termination without notice</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>30.4 Instructor acknowledges that compliance with Company policies is a material condition of engagement.</p>

                    {/* 31 */}
                    <h2 className={headingCls}>31. Waiver of Moral Damages</h2>
                    <p className={textCls}>
                        31.1 To the maximum extent permitted by applicable law, Instructor irrevocably waives any right to claim
                        moral damages, reputational damages, emotional distress damages, or similar non-economic damages against
                        the Company arising from:
                    </p>
                    <ul className={listCls}>
                        <li>Termination</li>
                        <li>Suspension</li>
                        <li>Student reassignment</li>
                        <li>Performance reviews</li>
                        <li>AI monitoring</li>
                        <li>Policy enforcement</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>31.2 This waiver applies globally and survives termination.</p>

                    {/* 32 */}
                    <h2 className={headingCls}>32. Waiver of Punitive &amp; Exemplary Damages</h2>
                    <p className={textCls}>32.1 To the fullest extent permitted by law, Instructor waives any right to recover:</p>
                    <ul className={listCls}>
                        <li>Punitive damages</li>
                        <li>Exemplary damages</li>
                        <li>Treble damages</li>
                        <li>Statutory penalties beyond actual proven damages</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>
                        32.2 In any dispute, recovery shall be limited strictly to direct, provable damages subject to the liability cap stated in this Agreement.
                    </p>

                    {/* 33 */}
                    <h2 className={headingCls}>33. Forum Selection Supremacy Clause</h2>
                    <p className={textCls}>
                        33.1 The dispute resolution and jurisdiction provisions of this Agreement shall supersede any conflicting law, rule, or regulation that might otherwise grant jurisdiction in another country.
                    </p>
                    <p className={`${textCls} mt-2`}>33.2 Instructor irrevocably agrees that:</p>
                    <ul className={listCls}>
                        <li>Vancouver, British Columbia, Canada shall be the exclusive forum</li>
                        <li>No foreign court shall have jurisdiction</li>
                        <li>Any proceeding brought outside Vancouver shall be dismissed</li>
                    </ul>
                    <p className={`${textCls} mt-2`}>33.3 Instructor waives any right to claim that Vancouver is an inconvenient or improper forum.</p>
                    <p className={`${textCls} mt-2`}>33.4 This clause applies regardless of Instructor&apos;s country of residence.</p>

                    {/* 34 */}
                    <h2 className={headingCls}>34. Governing Language</h2>
                    <p className={textCls}>34.1 This Agreement is drafted in the English language.</p>
                    <p className={`${textCls} mt-2`}>
                        34.2 If translated into any other language, the English version shall prevail in the event of conflict or inconsistency.
                    </p>
                    <p className={`${textCls} mt-2`}>
                        34.3 Instructor acknowledges understanding of the English language and waives any claim based on translation interpretation.
                    </p>

                    <div className="mt-10 pt-6 border-t border-slate-700/50">
                        <p className="text-slate-500 text-sm">Blu Codes Inc operating as Owl Mentors. Copyright 2026</p>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}
