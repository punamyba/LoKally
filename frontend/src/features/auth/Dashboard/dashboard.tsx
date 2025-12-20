const Dashboard = () => {
    const logout = () => {
      localStorage.clear();
      window.location.href = "/";
    };
  
    return (
      <div style={{ padding: "40px" }}>
        <h1>Dashboard 🔐</h1>
        <button onClick={logout}>Logout</button>
      </div>
    );
  };
  
  export default Dashboard;
  