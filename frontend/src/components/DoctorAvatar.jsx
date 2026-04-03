// Simple avatar component with circle head and shoulders
// Can be used for both doctors and patients
const UserAvatar = ({ gender, size = 100 }) => {
  // Color based on gender
  const getColor = () => {
    if (gender === 'Male') return '#667eea';
    if (gender === 'Female') return '#f093fb';
    return '#9ca3af'; // default gray
  };

  const color = getColor();

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circle head */}
      <circle cx="50" cy="35" r="20" fill={color} />
      
      {/* Shoulders - half parabola/arc */}
      <path 
        d="M 20 70 Q 50 85, 80 70 L 80 100 L 20 100 Z" 
        fill={color}
      />
    </svg>
  );
};

export default UserAvatar;
