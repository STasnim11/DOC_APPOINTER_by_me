export default function AuthLayout({ children, title }) {
  return (
    <div className="container">
      <div className="card fade-in">
        <div className="accent-stripe"></div>
        <div className="logo">⚕ DOC APPOINTER</div>
        <h2>{title}</h2>

        {children}
      </div>
    </div>
  );
}