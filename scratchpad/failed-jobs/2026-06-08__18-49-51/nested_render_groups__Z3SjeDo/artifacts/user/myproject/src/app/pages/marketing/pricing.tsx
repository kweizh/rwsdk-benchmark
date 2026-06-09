export const Pricing = () => (
  <div>
    <h1>Pricing</h1>
    <p style={{ marginTop: "1rem", color: "#555" }}>
      Simple, transparent pricing for teams of all sizes.
    </p>
    <div style={{ marginTop: "2rem", display: "flex", gap: "2rem" }}>
      <div style={{ border: "1px solid #d0d8e4", borderRadius: "8px", padding: "1.5rem", minWidth: "200px" }}>
        <h2>Free</h2>
        <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.5rem 0" }}>$0<span style={{ fontSize: "1rem", fontWeight: 400 }}>/mo</span></p>
        <p>Up to 3 projects</p>
      </div>
      <div style={{ border: "2px solid #0070f3", borderRadius: "8px", padding: "1.5rem", minWidth: "200px" }}>
        <h2>Pro</h2>
        <p style={{ fontSize: "2rem", fontWeight: 700, margin: "0.5rem 0" }}>$29<span style={{ fontSize: "1rem", fontWeight: 400 }}>/mo</span></p>
        <p>Unlimited projects</p>
      </div>
    </div>
  </div>
);
