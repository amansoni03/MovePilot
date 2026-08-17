const fs = require('fs');

// Helpers
const generatePath = (start, end, steps = 15) => {
  const path = [];
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = start.lat + (end.lat - start.lat) * ratio + Math.sin(ratio * Math.PI) * 0.005 * (i % 2 === 0 ? 1 : -1);
    const lng = start.lng + (end.lng - start.lng) * ratio + Math.cos(ratio * Math.PI) * 0.005 * (i % 3 === 0 ? 1 : -1);
    path.push([lat, lng]);
  }
  return path;
};

// 1. Generate Drivers
const indianNames = [
  "Amit Sharma", "Rakesh Verma", "Sanjay Kumar", "Vijay Singh", "Rajesh Patel",
  "Anil Gupta", "Sunil Dutt", "Ramesh Chawla", "Manoj Tiwari", "Vikram Rathore",
  "Karan Johar", "Arjun Reddy", "Pradeep Yadav", "Dinesh Karthik", "Suresh Raina",
  "Rahul Dravid", "Ashish Nehra", "Harbhajan Singh", "Mohit Sharma", "Yuvraj Singh",
  "Ajinkya Rahane", "Cheteshwar Pujara", "Jasprit Bumrah", "Hardik Pandya", "Krunal Pandya",
  "Ishant Sharma"
];

const seededDrivers = indianNames.map((name, index) => {
  const id = `DRV-${String(index + 1).padStart(3, '0')}`;
  return {
    id,
    name,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    phone: `+91 98765 ${50000 + index}`,
    licenseNumber: `DL-${10000 + index}/KA03`,
    licenseExpiry: `2029-12-${String((index % 28) + 1).padStart(2, '0')}`,
    busId: index < 22 ? `BUS-${String(index + 1).padStart(3, '0')}` : '',
    routeId: index < 22 ? `RT-${String(index + 1).padStart(3, '0')}` : '',
    experience: 5 + (index % 15),
    safetyStatus: index === 2 ? 'warning' : 'safe',
    status: index < 22 ? 'on route' : 'available',
  };
});

// 2. Generate Vehicles
const seededVehicles = [];
for (let i = 1; i <= 35; i++) {
  const id = `BUS-${String(i).padStart(3, '0')}`;
  const busNumber = `BUS ${String(i).padStart(2, '0')}`;
  let status = 'active';
  let maintenanceStatus = 'good';
  
  if (i > 28 && i <= 32) {
    status = 'maintenance';
    maintenanceStatus = 'maintenance';
  } else if (i > 32) {
    status = 'inactive';
    maintenanceStatus = 'good';
  }
  
  if (i === 12) {
    status = 'emergency';
  }
  if (i === 3) {
    maintenanceStatus = 'expiring';
  }
  if (i === 15) {
    maintenanceStatus = 'expired';
  }

  seededVehicles.push({
    id,
    busNumber,
    registrationNumber: `KA-03-EQ-${2000 + i}`,
    model: i % 2 === 0 ? "Tata Starbus 40S" : "Ashok Leyland Lynx",
    capacity: 40,
    currentStudents: 0,
    driverId: i <= 22 ? `DRV-${String(i).padStart(3, '0')}` : '',
    routeId: i <= 22 ? `RT-${String(i).padStart(3, '0')}` : '',
    gpsStatus: i === 18 ? 'disconnected' : 'connected',
    gpsDeviceId: `GPS-AIS-${10000 + i}`,
    insuranceExpiry: `2027-04-${String((i % 28) + 1).padStart(2, '0')}`,
    fitnessExpiry: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`,
    pollutionExpiry: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`,
    maintenanceStatus,
    status,
    currentSpeed: status === 'active' && i <= 18 ? 32 + (i % 15) : 0,
    maxSpeedLimit: 50
  });
}

// 3. Generate Routes
const schoolLocations = [
  { name: "Greenfield International School", lat: 12.9716, lng: 77.5946 },
  { name: "Hill Side School", lat: 12.9912, lng: 77.5721 },
  { name: "Sunrise Public School", lat: 12.9515, lng: 77.6251 },
  { name: "Lake View College", lat: 12.9325, lng: 77.5482 },
  { name: "St. Mary School", lat: 12.9810, lng: 77.6432 },
];

const stopNames = [
  "Indiranagar Circle", "Koramangala 5th Block", "HSR Layout BDA Complex", "Whitefield Metro Stn",
  "Jayanagar 4th Block", "Malleshwaram 8th Cross", "Hebbal Flyover Junction", "MG Road Metro",
  "Bannerghatta Road Apex", "Basavanagudi Temple St", "Richmond Road Plaza", "Frazer Town Mosque",
  "Ulsoor Lake Gate", "RT Nagar Main Stop", "Rajajinagar Bridge", "BTM Layout Water Tank",
  "Domlur Flyover", "Bellandur Outer Ring Road", "Sarjapur Fire Station", "Vasanth Nagar Park"
];

const seededRoutes = [];
for (let i = 1; i <= 22; i++) {
  const id = `RT-${String(i).padStart(3, '0')}`;
  const routeNumber = `Route ${i}`;
  const school = schoolLocations[(i - 1) % schoolLocations.length];
  
  const stopsCount = 5 + (i % 4);
  const stops = [];
  
  const angle = (i * 2 * Math.PI) / 22;
  const radius = 0.08;
  const endPoint = {
    lat: school.lat + Math.sin(angle) * radius,
    lng: school.lng + Math.cos(angle) * radius
  };

  const path = generatePath(school, endPoint, 30);

  for (let j = 0; j < stopsCount; j++) {
    const pathIndex = Math.floor((j / (stopsCount - 1)) * (path.length - 1));
    const stopCoords = path[pathIndex];
    const hour = 7;
    const minutes = 30 + Math.floor((j / stopsCount) * 45);
    stops.push({
      name: stopNames[(i + j) % stopNames.length] + ` Stop ${j+1}`,
      lat: stopCoords[0],
      lng: stopCoords[1],
      scheduledTime: `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} AM`,
      status: 'pending',
      boardedCount: 0
    });
  }

  const status = i <= 18 ? 'running' : 'scheduled';
  
  seededRoutes.push({
    id,
    name: `${school.name.split(' ')[0]} ↔ Zone ${String.fromCharCode(65 + (i % 6))}`,
    routeNumber,
    busId: `BUS-${String(i).padStart(3, '0')}`,
    driverId: `DRV-${String(i).padStart(3, '0')}`,
    stops: JSON.stringify(stops), // stringify nested array for CSV
    studentsCount: 20 + (i % 15),
    distance: 12 + (i % 10),
    duration: 35 + (i % 20),
    status,
    path: JSON.stringify(path), // stringify nested array for CSV
    currentPathIndex: status === 'running' ? Math.floor(path.length * 0.4) : 0,
    departureTime: "07:30 AM",
    expectedArrivalTime: "08:30 AM"
  });
}

// 4. Generate Students
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

const seededStudents = [];
let studentCounter = 1;
let totalBoarded = 0;

seededRoutes.forEach((route) => {
  const routeBus = seededVehicles.find(v => v.id === route.busId);
  const isRouteRunning = route.status === 'running';
  const numStudents = route.studentsCount;
  let routeBoarded = 0;

  // Un-stringify stops for logic
  const stops = JSON.parse(route.stops);

  for (let s = 0; s < numStudents; s++) {
    const studentId = `STU-${String(studentCounter).padStart(4, '0')}`;
    const fName = firstNames[(studentCounter * 3) % firstNames.length];
    const lName = lastNames[(studentCounter * 7) % lastNames.length];
    const name = `${fName} ${lName}`;
    
    const stopIndex = s % stops.length;
    const pickupStop = stops[stopIndex].name;
    
    let boardingStatus = 'not boarded';
    
    if (isRouteRunning) {
      if (totalBoarded < 512) {
        const roll = (studentCounter % 10);
        if (roll < 8) {
          boardingStatus = 'boarded';
          totalBoarded++;
          routeBoarded++;
        } else if (roll === 8) {
          boardingStatus = 'dropped off';
          routeBoarded++;
        } else {
          boardingStatus = 'absent';
        }
      }
    }

    seededStudents.push({
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
      boardingTime: boardingStatus === 'boarded' || boardingStatus === 'dropped off' ? '08:12 AM' : '',
      dropTime: boardingStatus === 'dropped off' ? '08:35 AM' : ''
    });

    studentCounter++;
  }

  if (routeBus) {
    routeBus.currentStudents = routeBoarded;
  }
});

let currentBoarded = seededStudents.filter(s => s.boardingStatus === 'boarded').length;
if (currentBoarded < 512) {
  for (const s of seededStudents) {
    const r = seededRoutes.find(route => route.id === s.routeId);
    if (r && r.status === 'running' && s.boardingStatus === 'not boarded') {
      s.boardingStatus = 'boarded';
      s.boardingTime = '08:15 AM';
      currentBoarded++;
      
      const bus = seededVehicles.find(v => v.id === s.busId);
      if (bus) bus.currentStudents++;

      if (currentBoarded === 512) break;
    }
  }
}

// Convert object array to CSV
function toCSV(dataArr) {
  if (dataArr.length === 0) return '';
  const headers = Object.keys(dataArr[0]);
  const rows = dataArr.map(obj => 
    headers.map(h => {
      let val = obj[h];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        val = '"' + val.replace(/"/g, '""') + '"';
      }
      return val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

fs.writeFileSync('demo_vehicles.csv', toCSV(seededVehicles));
fs.writeFileSync('demo_drivers.csv', toCSV(seededDrivers));
fs.writeFileSync('demo_routes.csv', toCSV(seededRoutes));
fs.writeFileSync('demo_students.csv', toCSV(seededStudents));

console.log("CSV files generated successfully.");
