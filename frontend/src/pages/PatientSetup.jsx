export default function PatientSetup() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div>
      <h2>Patient Profile Setup</h2>
      <p>Welcome {user?.name}</p>
      <p>Fill your patient information here.</p>
    </div>
  );
}