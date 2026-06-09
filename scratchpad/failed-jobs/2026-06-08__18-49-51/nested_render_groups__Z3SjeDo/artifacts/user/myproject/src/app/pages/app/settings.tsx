export const Settings = () => (
  <div>
    <h1>Settings</h1>
    <p style={{ marginTop: "1rem", color: "#a0b4d0" }}>
      Configure your application preferences.
    </p>
    <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
      <div style={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: "8px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontWeight: 600 }}>Email Notifications</p>
          <p style={{ fontSize: "0.875rem", color: "#a0b4d0" }}>Receive updates via email</p>
        </div>
        <span style={{ background: "#0f3460", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem" }}>On</span>
      </div>
      <div style={{ background: "#16213e", border: "1px solid #0f3460", borderRadius: "8px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontWeight: 600 }}>Two-Factor Auth</p>
          <p style={{ fontSize: "0.875rem", color: "#a0b4d0" }}>Add an extra layer of security</p>
        </div>
        <span style={{ background: "#2d2d2d", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem" }}>Off</span>
      </div>
    </div>
  </div>
);
