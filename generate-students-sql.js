const fs = require('fs');

// Reproduce the exact same seed logic from AppContext.tsx
const firstNames = [
  "Aarav", "Aanya", "Vihaan", "Aditi", "Sai", "Ananya", "Krishna", "Prisha",
  "Ishaan", "Diya", "Kabir", "Meera", "Rohan", "Saanvi", "Arjun", "Kavya",
  "Dev", "Riya", "Atharv", "Avani", "Reyansh", "Anika", "Shaurya", "Zara",
  "Aaryan", "Ira", "Kian", "Ridhi", "Dhruv", "Myra", "Siddharth", "Aisha"
];
const lastNames = [
  "Sharma", "Verma", "Kumar", "Singh", "Patel", "Gupta", "Nair", "Iyer",
  "Reddy", "Rao", "Joshi", "Mehta", "Das", "Choudhury", "Pillai", "Bose",
  "Sen", "Roy", "Deshmukh", "Kulkarni", "Prasad", "Mishra", "Pandey", "Dubey"
];

const stopNames = [
  "Indiranagar Circle", "Koramangala 5th Block", "HSR Layout BDA Complex", "Whitefield Metro Stn",
  "Jayanagar 4th Block", "Malleshwaram 8th Cross", "Hebbal Flyover Junction", "MG Road Metro",
  "Bannerghatta Road Apex", "Basavanagudi Temple St", "Richmond Road Plaza", "Frazer Town Mosque",
  "Ulsoor Lake Gate", "RT Nagar Main Stop", "Rajajinagar Bridge", "BTM Layout Water Tank",
  "Domlur Flyover", "Bellandur Outer Ring Road", "Sarjapur Fire Station", "Vasanth Nagar Park"
];

// Route info (matching seed)
const routes = [];
for (let i = 1; i <= 22; i++) {
  const stopsCount = 5 + (i % 4);
  const stops = [];
  for (let j = 0; j < stopsCount; j++) {
    stops.push({ name: stopNames[(i + j) % stopNames.length] + ` Stop ${j+1}` });
  }
  routes.push({
    id: `RT-${String(i).padStart(3, '0')}`,
    busId: `BUS-${String(i).padStart(3, '0')}`,
    studentsCount: 20 + (i % 15),
    status: i <= 18 ? 'running' : 'scheduled',
    stops
  });
}

const students = [];
let studentCounter = 1;
let totalBoarded = 0;

routes.forEach((route) => {
  const isRouteRunning = route.status === 'running';
  const numStudents = route.studentsCount;

  for (let s = 0; s < numStudents; s++) {
    const studentId = `STU-${String(studentCounter).padStart(4, '0')}`;
    const fName = firstNames[(studentCounter * 3) % firstNames.length];
    const lName = lastNames[(studentCounter * 7) % lastNames.length];
    const name = `${fName} ${lName}`;
    
    const stopIndex = s % route.stops.length;
    const pickupStop = route.stops[stopIndex].name;
    
    let boardingStatus = 'not boarded';
    let boardingTime = '';
    let dropTime = '';
    
    if (isRouteRunning) {
      if (totalBoarded < 512) {
        const roll = (studentCounter % 10);
        if (roll < 8) {
          boardingStatus = 'boarded';
          boardingTime = '08:12 AM';
          totalBoarded++;
        } else if (roll === 8) {
          boardingStatus = 'dropped off';
          boardingTime = '08:12 AM';
          dropTime = '08:35 AM';
        } else {
          boardingStatus = 'absent';
        }
      }
    }

    students.push({
      id: studentId,
      name,
      class: `${1 + (studentCounter % 10)}`,
      section: String.fromCharCode(65 + (studentCounter % 3)),
      routeId: route.id,
      busId: route.busId,
      pickupStop,
      boardingStatus,
      parentName: `Mr. & Mrs. ${lName}`,
      parentContact: `+91 99887 ${70000 + studentCounter}`,
      emergencyContact: `+91 91111 ${10000 + studentCounter}`,
      boardingTime,
      dropTime
    });

    studentCounter++;
  }
});

// Fix up to 512 boarded
let currentBoarded = students.filter(s => s.boardingStatus === 'boarded').length;
if (currentBoarded < 512) {
  for (const s of students) {
    const r = routes.find(route => route.id === s.routeId);
    if (r && r.status === 'running' && s.boardingStatus === 'not boarded') {
      s.boardingStatus = 'boarded';
      s.boardingTime = '08:15 AM';
      currentBoarded++;
      if (currentBoarded === 512) break;
    }
  }
}

// Generate SQL
const esc = (str) => str.replace(/'/g, "''");

let sql = `-- ============================================================\n`;
sql += `-- STUDENT SEED DATA (${students.length} rows)\n`;
sql += `-- Append this to supabase_schema.sql or run separately\n`;
sql += `-- ============================================================\n\n`;

// Batch insert in groups of 50 for readability
const batchSize = 50;
for (let b = 0; b < students.length; b += batchSize) {
  const batch = students.slice(b, b + batchSize);
  sql += `INSERT INTO students (id, name, class, section, route_id, bus_id, pickup_stop, boarding_status, parent_name, parent_contact, emergency_contact, boarding_time, drop_time) VALUES\n`;
  
  const rows = batch.map(s => {
    return `('${s.id}', '${esc(s.name)}', '${s.class}', '${s.section}', '${s.routeId}', '${s.busId}', '${esc(s.pickupStop)}', '${s.boardingStatus}', '${esc(s.parentName)}', '${s.parentContact}', '${s.emergencyContact}', ${s.boardingTime ? `'${s.boardingTime}'` : 'NULL'}, ${s.dropTime ? `'${s.dropTime}'` : 'NULL'})`;
  });
  
  sql += rows.join(',\n') + ';\n\n';
}

fs.writeFileSync('supabase_students_seed.sql', sql);
console.log(`Generated ${students.length} student INSERT statements.`);
