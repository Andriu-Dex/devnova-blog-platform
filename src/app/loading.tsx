export default function Loading() {
  return (
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh", 
      backgroundColor: "#09090b" 
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px"
      }}>
        <div className="spinner" style={{
          width: "48px",
          height: "48px",
          border: "4px solid rgba(59, 130, 246, 0.2)",
          borderTopColor: "#3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <h2 style={{
          color: "#f8fafc",
          fontSize: "1.2rem",
          fontWeight: 500,
          letterSpacing: "0.05em",
          margin: 0
        }}>
          Cargando...
        </h2>
        
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
