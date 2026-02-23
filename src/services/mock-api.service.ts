import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { faker } from '@faker-js/faker';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  phone: string;
  location: string;
}

interface VacationBalance {
  employeeId: string;
  name: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  pendingRequests: number;
}

interface SalaryInfo {
  employeeId: string;
  name: string;
  baseSalary: number;
  currency: string;
  payFrequency: 'monthly' | 'bi-weekly';
  lastRaiseDate: string;
}

interface ScheduleEntry {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  type: 'meeting' | 'focus' | 'break' | 'other';
}

const DEPARTMENTS = ['Engineering', 'Marketing', 'HR', 'Finance', 'Sales'];
const EMPLOYEE_COUNT = 10;

@Injectable()
export class MockApiService implements OnModuleInit {
  private readonly logger = new Logger(MockApiService.name);
  private employees: Employee[] = [];
  private vacationData: Record<string, VacationBalance> = {};
  private salaryData: Record<string, SalaryInfo> = {};
  private scheduleData: Record<string, ScheduleEntry[]> = {};

  onModuleInit() {
    faker.seed(42);
    this.generateMockData();
    this.logger.log(`Generated mock data for ${this.employees.length} employees`);
  }

  private generateMockData() {
    
    for (let i = 1; i <= EMPLOYEE_COUNT; i++) {
      const id = `EMP${String(i).padStart(3, '0')}`;
      const name = faker.person.fullName();
      const department = faker.helpers.arrayElement(DEPARTMENTS);

      this.employees.push({
        id,
        name,
        email: faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] }).toLowerCase(),
        department,
        title: faker.person.jobTitle(),
        phone: faker.phone.number({ style: 'international' }),
        location: faker.location.city(),
      });

      const totalDays = 25;
      const usedDays = faker.number.int({ min: 0, max: 22 });
      this.vacationData[id] = {
        employeeId: id,
        name,
        totalDays,
        usedDays,
        remainingDays: totalDays - usedDays,
        pendingRequests: faker.number.int({ min: 0, max: 3 }),
      };

      this.salaryData[id] = {
        employeeId: id,
        name,
        baseSalary: faker.number.int({ min: 60000, max: 150000 }),
        currency: 'USD',
        payFrequency: faker.helpers.arrayElement(['monthly', 'bi-weekly']),
        lastRaiseDate: faker.date.past({ years: 1 }).toISOString().split('T')[0],
      };

      const meetingTitles = ['Sprint Planning', 'Team Standup', '1:1 with Manager', 'Design Review', 'Retro'];
      const rooms = ['Room A', 'Room B', 'Room C', 'Zoom', 'Desk'];
      const today = new Date().toISOString().split('T')[0];
      const entryCount = faker.number.int({ min: 1, max: 4 });
      const entries: ScheduleEntry[] = [];

      for (let j = 0; j < entryCount; j++) {
        const startHour = 8 + j * 2;
        entries.push({
          date: today,
          startTime: `${String(startHour).padStart(2, '0')}:00`,
          endTime: `${String(startHour + 1).padStart(2, '0')}:00`,
          title: faker.helpers.arrayElement(meetingTitles),
          location: faker.helpers.arrayElement(rooms),
          type: faker.helpers.arrayElement(['meeting', 'focus', 'break']),
        });
      }
      this.scheduleData[id] = entries;
    }
  }

  async getVacationBalance(employeeId: string): Promise<VacationBalance> {
    const data = this.vacationData[employeeId];
    if (!data) throw new NotFoundException(`Employee ${employeeId} not found`);
    return data;
  }

  async getSalaryInfo(employeeId: string): Promise<SalaryInfo> {
    const data = this.salaryData[employeeId];
    if (!data) throw new NotFoundException(`Employee ${employeeId} not found`);
    return data;
  }

  async searchDirectory(query: string, department?: string): Promise<Employee[]> {
    const q = query.toLowerCase();
    return this.employees.filter((emp) => {
      const matchesQuery =
        emp.name.toLowerCase().includes(q) ||
        emp.title.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q);
      const matchesDept = !department || emp.department.toLowerCase() === department.toLowerCase();
      return matchesQuery && matchesDept;
    });
  }

  async getSchedule(employeeId: string, _date?: string): Promise<ScheduleEntry[]> {
    return this.scheduleData[employeeId] || [];
  }
}
