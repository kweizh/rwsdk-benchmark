export const Profile = () => (
  <div>
    <h1>Profile</h1>
    <p style={{ marginTop: "1rem", color: "#a0b4d0" }}>
      Manage your personal information and account details.
    </p>
    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
      <div style={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: "8px", padding: "1rem" }}>
        <label style={{ fontSize: "0.75rem", color: "#a0b4d0", display: "block", marginBottom: "0.25rem" }}>Name</label>
        <p>Jane Doe</p>
      </div>
      <div style={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: "8px", padding: "1rem" }}>
        <label style={{ fontSize: "0.75rem", color: "#a0b4d0", display: "block", marginBottom: "0.25rem" }}>Email</label>
        <p>jane@example.com</p>
      </div>
    </div>
  </div>
);
