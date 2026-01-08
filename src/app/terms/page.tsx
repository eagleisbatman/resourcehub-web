import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - ResourceHub",
  description: "Terms of Service for ResourceHub - Digital Green Foundation",
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg max-w-none space-y-6">
        <p className="text-muted-foreground">
          <strong>Last Updated:</strong> {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>
            These Terms of Service ("Terms") govern your access to and use of ResourceHub ("Service"), 
            an internal resource tracking and management system operated by Digital Green Foundation and 
            its sister concerns (collectively, "Digital Green," "we," "our," or "us").
          </p>
          <p>
            By accessing or using the Service, you agree to be bound by these Terms. If you do not 
            agree to these Terms, you may not access or use the Service.
          </p>
          <p>
            <strong>This Service is intended solely for authorized employees, contractors, and personnel 
            of Digital Green Foundation and its affiliated organizations.</strong> Unauthorized access 
            or use is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Eligibility and Authorization</h2>
          <p>To use the Service, you must:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Be an authorized employee, contractor, or personnel of Digital Green Foundation or its sister concerns</li>
            <li>Have a valid email address from an authorized domain</li>
            <li>Have been granted access by an authorized administrator</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Be at least 18 years of age</li>
          </ul>
          <p className="mt-4">
            We reserve the right to verify your authorization and revoke access at any time if you 
            no longer meet these requirements or violate these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Account Registration and Security</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and 
            for all activities that occur under your account. You agree to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide accurate, current, and complete information during registration</li>
            <li>Maintain and promptly update your account information</li>
            <li>Keep your password secure and confidential</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
            <li>Use only your own account and not share credentials with others</li>
            <li>Log out of your account when finished using the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Acceptable Use</h2>
          <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Violate any applicable local, state, national, or international law</li>
            <li>Attempt to gain unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service or servers connected to the Service</li>
            <li>Transmit any viruses, malware, or other harmful code</li>
            <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
            <li>Use automated systems (bots, scrapers) to access the Service without authorization</li>
            <li>Share your account credentials with unauthorized persons</li>
            <li>Access or attempt to access other users' accounts or data without authorization</li>
            <li>Modify, adapt, or create derivative works based on the Service</li>
            <li>Remove any copyright, trademark, or proprietary notices from the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Accuracy and Responsibility</h2>
          <p>
            You are responsible for ensuring the accuracy and completeness of all data you enter into 
            the Service, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Project information and details</li>
            <li>Resource allocations and assignments</li>
            <li>Time tracking data (planned and actual hours)</li>
            <li>Project status updates</li>
            <li>Any other information you provide</li>
          </ul>
          <p className="mt-4">
            You acknowledge that inaccurate or incomplete data may affect resource planning, project 
            management, and organizational decision-making. Digital Green is not responsible for 
            consequences arising from inaccurate data entered by users.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Intellectual Property Rights</h2>
          <p>
            The Service and its original content, features, and functionality are owned by Digital 
            Green and are protected by international copyright, trademark, patent, trade secret, and 
            other intellectual property laws.
          </p>
          <p>
            You are granted a limited, non-exclusive, non-transferable, revocable license to access 
            and use the Service for internal business purposes only, subject to these Terms. This 
            license does not include any right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Resell or commercially use the Service</li>
            <li>Copy, modify, or create derivative works</li>
            <li>Use the Service for competitive purposes</li>
            <li>Remove any proprietary notices or labels</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. User Content and Data</h2>
          <p>
            You retain ownership of any data and content you submit to the Service. By submitting 
            data to the Service, you grant Digital Green a worldwide, non-exclusive, royalty-free 
            license to use, store, process, and display such data solely for the purpose of providing 
            and improving the Service.
          </p>
          <p>
            You represent and warrant that you have all necessary rights and permissions to submit 
            any data or content to the Service and that such data does not infringe upon any third-party 
            rights.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Privacy</h2>
          <p>
            Your use of the Service is also governed by our Privacy Policy, which explains how we 
            collect, use, and protect your information. By using the Service, you consent to the 
            collection and use of your information as described in our Privacy Policy.
          </p>
          <p>
            Please review our Privacy Policy at:{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Service Availability and Modifications</h2>
          <p>
            We strive to maintain the availability of the Service but do not guarantee uninterrupted, 
            error-free, or secure access. The Service may be unavailable due to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Scheduled maintenance</li>
            <li>Technical issues or failures</li>
            <li>Force majeure events</li>
            <li>Security concerns</li>
          </ul>
          <p className="mt-4">
            We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) 
            at any time, with or without notice. We shall not be liable to you or any third party for 
            any modification, suspension, or discontinuation of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Termination</h2>
          <p>
            We may terminate or suspend your access to the Service immediately, without prior notice, 
            for any reason, including but not limited to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Violation of these Terms</li>
            <li>Unauthorized access or use</li>
            <li>Fraudulent, abusive, or illegal activity</li>
            <li>Request by law enforcement or government agencies</li>
            <li>Discontinuation of your employment or relationship with Digital Green</li>
            <li>Extended periods of inactivity</li>
          </ul>
          <p className="mt-4">
            Upon termination, your right to use the Service will immediately cease. We may delete 
            or deactivate your account and all associated data, subject to our data retention policies 
            and legal obligations.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER 
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR 
            A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR COURSE OF PERFORMANCE.
          </p>
          <p>
            We do not warrant that the Service will be uninterrupted, secure, error-free, or free from 
            viruses or other harmful components. You use the Service at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DIGITAL GREEN SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, 
            WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER 
            INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your use or inability to use the Service</li>
            <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
            <li>Any interruption or cessation of transmission to or from the Service</li>
            <li>Any bugs, viruses, trojan horses, or the like that may be transmitted to or through the Service</li>
            <li>Any errors or omissions in any content or for any loss or damage incurred as a result of the use of any content</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold harmless Digital Green, its affiliates, officers, 
            directors, employees, and agents from and against any claims, liabilities, damages, losses, 
            and expenses, including without limitation reasonable attorney's fees, arising out of or in 
            any way connected with:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your access to or use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any third-party right, including any intellectual property right or privacy right</li>
            <li>Any data or content you submit to the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], 
            without regard to its conflict of law provisions. Any disputes arising out of or relating to 
            these Terms or the Service shall be resolved through good faith negotiation, and if necessary, 
            through binding arbitration or in the courts of [Jurisdiction].
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify you of any material 
            changes by posting the new Terms on this page and updating the "Last Updated" date. Your 
            continued use of the Service after such modifications constitutes acceptance of the updated 
            Terms.
          </p>
          <p>
            If you do not agree to the modified Terms, you must stop using the Service and may request 
            deletion of your account.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">16. Severability</h2>
          <p>
            If any provision of these Terms is found to be unenforceable or invalid, that provision 
            shall be limited or eliminated to the minimum extent necessary, and the remaining provisions 
            shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">17. Entire Agreement</h2>
          <p>
            These Terms, together with our Privacy Policy, constitute the entire agreement between you 
            and Digital Green regarding your use of the Service and supersede all prior agreements and 
            understandings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">18. Contact Information</h2>
          <p>
            If you have any questions about these Terms, please contact us:
          </p>
          <div className="mt-4 space-y-2">
            <p>
              <strong>Digital Green Foundation</strong>
            </p>
            <p>
              Email: <a href="mailto:gautam@digitalgreen.org" className="text-primary hover:underline">gautam@digitalgreen.org</a>
            </p>
            <p>
              For technical support or account-related inquiries, please contact your system administrator 
              or the IT department.
            </p>
          </div>
        </section>

        <section className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            By using ResourceHub, you acknowledge that you have read, understood, and agree to be bound 
            by these Terms of Service.
          </p>
        </section>
      </div>
    </div>
  );
}
