export const Dashboard = () => (
  <div>
    <h1>Dashboard</h1>
    <p style={{ marginTop: "1rem", color: "#a0b4d0" }}>
      Welcome back! Here's what's happening with your account today.
    </p>
    <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
      <div style={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: "8px", padding: "1.5rem", minWidth: "150px" }}>
        <p style={{ fontSize: "0.75rem", color: "#a0b4d0", textTransform: "uppercase" }}>Projects</p>
        <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>12</p>
      </div>
      <div style={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: "8px", padding: "1.5rem", minWidth: "150px" }}>
        <p style={{ fontSize: "0.75rem", color: "#a0b4d0", textTransform: "uppercase" }}>Tasks</p>
        <p style={{ fontSize: "2rem", fontWeight: 700, marginTop: "0.25rem" }}>47</p>
      </div>
    </div>
  </div>
);
