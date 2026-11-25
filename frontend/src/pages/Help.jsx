import { useAuth } from '../auth/AuthContext.jsx';

const Section = ({ title, icon, children }) => (
  <section className="card" style={{ padding: '20px 24px' }}>
    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 15 }}>
      <span>{icon}</span> {title}
    </h3>
    {children}
  </section>
);

export default function Help() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  return (
    <div>
      <div className="page-hd">
        <h2>Help — Using WSMS</h2>
        <p>Guides on common workflows and understanding request statuses.</p>
      </div>

      <div className="help">
        <Section title="Getting started" icon="🚀">
          <ul>
            <li><strong>Register</strong> with your username, email, department, designation and your superior (approver).</li>
            <li><strong>Login</strong> from the sign-in page; you can <strong>change your password</strong> at any time from the sidebar.</li>
            <li>Every key action (submit, approve, reject, cancel, password change) sends an <strong>email</strong> to you and your superior.</li>
          </ul>
        </Section>

        <Section title="Requesting stationery" icon="📦">
          <ul>
            <li><strong>Availability</strong> shows all items you are eligible to request, with live stock counts and category chips.</li>
            <li><strong>Eligibility</strong> shows your designation-based purchase cap, committed value across active requests, and remaining balance.</li>
            <li><strong>New Request</strong>: pick one or more items, set quantities and from/to dates. The total must stay within your remaining eligibility and each item's stock.</li>
            <li><strong>My Requests</strong>: track the status of all your submissions. <em>Withdraw</em> a request still awaiting approval; <em>request cancellation</em> of one already approved — your manager must confirm it.</li>
          </ul>
        </Section>

        {isManager && (
          <Section title="Manager actions" icon="⚡">
            <ul>
              <li><strong>Approvals</strong>: view all submitted requests, approve or reject them. Approving reduces each line item's stock. Confirming a cancellation restores it.</li>
              <li><strong>Cost Report</strong>: per-item cost, % of the institution total, head count per item, and cumulative cost across all approved requests.</li>
            </ul>
          </Section>
        )}

        <Section title="Request statuses" icon="🔄">
          <ul>
            <li><strong>Awaiting approval</strong> — submitted, with your manager to review.</li>
            <li><strong>Approved / Rejected</strong> — decided by a manager; stock is decremented on approval.</li>
            <li><strong>Withdrawn</strong> — you pulled it back before a decision was made.</li>
            <li><strong>Cancellation requested → Cancelled</strong> — you asked to cancel an approved request and your manager confirmed it. Stock is restored.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
