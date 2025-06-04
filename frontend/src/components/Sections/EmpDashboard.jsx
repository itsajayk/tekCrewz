import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, onSnapshot, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { auth, db } from '../Pages/firebase';
import TopNavbar from '../Nav/TopNavbar';
import Footer from './Footer';

const numberToWords = (num) => {
  const a = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (num === 0) return 'Zero';
  if (num < 20) return a[num];
  if (num < 100) return b[Math.floor(num/10)] + (num%10 ? ' ' + a[num%10] : '');
  if (num < 1000) return a[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' ' + numberToWords(num%100) : '');
  if (num < 1000000) return numberToWords(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' ' + numberToWords(num%1000) : '');
  return numberToWords(Math.floor(num/1000000)) + ' Million' + (num%1000000 ? ' ' + numberToWords(num%1000000) : '');
};

export default function EmpDashboard() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);

  // Projects
  const [newProject, setNewProject] = useState({ projectId: '', name: '', timeAllocated: '' });
  // Tasks
  const [newTasksText, setNewTasksText] = useState('');

  // Payroll
  const [newPayroll, setNewPayroll] = useState({
    periodStart: '', periodEnd: '', basicSalary: '', allowances: '', deductions: '',
    overtimeRate: '', overtimeHours: '', odRate: '', odHours: '', paidLeaves: '', taxRate: ''
  });

  // Student modal data
  const [students, setStudents] = useState([]);
  const [stuModal, setStuModal] = useState({ open: false, action: '', profile: null });
  const [formData, setFormData] = useState({});

  // Payroll calculations
  const basic = parseFloat(newPayroll.basicSalary) || 0;
  const allow = parseFloat(newPayroll.allowances) || 0;
  const ded = parseFloat(newPayroll.deductions) || 0;
  const otRate = parseFloat(newPayroll.overtimeRate) || 0;
  const otHours = parseFloat(newPayroll.overtimeHours) || 0;
  const odRate = parseFloat(newPayroll.odRate) || 0;
  const odHours = parseFloat(newPayroll.odHours) || 0;
  const paidLeaves = parseFloat(newPayroll.paidLeaves) || 0;
  const taxPerc = parseFloat(newPayroll.taxRate) || 0;

  const overtimePay = +(otRate * otHours).toFixed(2);
  const odPay = +(odRate * odHours).toFixed(2);
  const leaveDeduction = +((basic / 30) * paidLeaves).toFixed(2);

  const grossPay = +(basic + allow + overtimePay + odPay).toFixed(2);
  const taxAmount = +((grossPay * taxPerc) / 100).toFixed(2);
  const netPay = +(grossPay - ded - taxAmount - leaveDeduction).toFixed(2);
  const amountWords = numberToWords(Math.round(netPay));

  const validPrefixes = ['EMPDT', 'EMPTR', 'EMPDV'];

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => validPrefixes.some(pref => u.id.startsWith(pref)));
      setEmployees(list);
    });
    return unsub;
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, u => {
      if (!u) return navigate('/a-login');
      import('firebase/firestore').then(() => {
        const unsub = onSnapshot(
          collection(db, 'users'),
          snap => {
            const list = snap.docs
              .map(d => ({ id: d.id, ...d.data() }))
              .filter(u => validPrefixes.some(pref => u.id.startsWith(pref)));
            setEmployees(list);
          }
        );
        return unsub;
      });
      fetch('/api/admin/students')
        .then(r => r.json())
        .then(setStudents)
        .catch(console.error);
    });
  }, [navigate]);

  const resetModals = () => {
    setSelectedUser(null);
    setModalType(null);
    setNewProject({ projectId: '', name: '', timeAllocated: '' });
    setNewTasksText('');
    setNewPayroll({ periodStart:'', periodEnd:'', basicSalary:'', allowances:'', deductions:'', overtimeRate:'', overtimeHours:'', odRate:'', odHours:'', paidLeaves:'', taxRate:'' });
    setStuModal({ open: false, action: '', profile: null });
    setFormData({});
  };

  const addProject = async () => {
    if (!selectedUser) return;
    const ref = doc(db, 'users', selectedUser.id);
    await updateDoc(ref, {
      projects: arrayUnion({
        projectId: newProject.projectId,
        name: newProject.name,
        tasks: [],
        timeAllocated: Number(newProject.timeAllocated),
        timeConsumed: 0,
        status: 'Pending',
        percentage: 0,
      }),
    });
    resetModals();
  };

  const addTasks = async () => {
    if (!selectedUser) return;
    const lines = newTasksText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const tasks = lines.map(line => ({ chapter: line.replace(/^\d+\.?\s*/, ""), assignedAt: new Date(), completedAt: null }));
    const ref = doc(db, 'users', selectedUser.id);
    await updateDoc(ref, { tasks: arrayUnion(...tasks) });
    resetModals();
  };

  const addPayroll = async () => {
    if (!selectedUser) return;
    const ref = doc(db, 'users', selectedUser.id);
    const existing = selectedUser.payrolls || [];
    await updateDoc(ref, {
      payrolls: [...existing, {
        periodStart: new Date(newPayroll.periodStart),
        periodEnd: new Date(newPayroll.periodEnd),
        basicSalary: basic,
        allowances: allow,
        deductions: ded,
        overtimeRate: otRate,
        overtimeHours: otHours,
        odRate: odRate,
        odHours: odHours,
        paidLeaves: paidLeaves,
        leaveDeduction: leaveDeduction,
        taxRate: taxPerc,
        overtimePay: overtimePay,
        odPay: odPay,
        grossPay: grossPay,
        taxAmount: taxAmount,
        netPay: netPay,
        amountWords: amountWords,
        createdAt: new Date()
      }]
    });
    resetModals();
  };

  const logout = async () => { await signOut(auth); navigate('/a-login'); };

  const openEmp = (u, type) => setModalType(type);
  const openStu = (profile, action) => {
    setStuModal({ open: true, profile, action });
    setFormData(profile[action] || {});
  };

  return (
    <Page>
      <TopNavbar />
      <Container>
        <Title>Employee Dashboard</Title>
        <Grid>
          {employees.map((user) => {
            const tasksArray = Array.isArray(user.tasks) ? user.tasks : [];
            const totalTasks = tasksArray.length;
            const completedTasks = tasksArray.filter(t => t.status === 'Completed' || t.completedAt).length;
            const inProgressTasks = tasksArray.filter(t => t.status === 'In Progress').length;
            const pendingTasks = tasksArray.filter(t => !t.status || t.status === 'Pending').length;
            return (
              <Card key={user.id}>
                <CardHeader>
                  <h3>{user.name}</h3>
                  <Badge>{user.id}</Badge>
                </CardHeader>
                <Section>
                  <SectionTitle>Projects</SectionTitle>
                  <List>
                    {(Array.isArray(user.projects) && user.projects.length > 0)
                      ? user.projects.map((p) => (
                          <ListItem key={p.projectId}>
                            <strong>{p.name}</strong>
                            <Tag>{p.percentage}%</Tag>
                          </ListItem>
                        ))
                      : <SmallInfo>None</SmallInfo>
                    }
                  </List>
                </Section>
                <Section>
                  <SectionTitle>No of Tasks {totalTasks}</SectionTitle>
                  <List>Completed: {completedTasks}, Pending: {pendingTasks}, In Progress: {inProgressTasks}</List>
                </Section>
                <Actions>
                  <Button onClick={() => { setSelectedUser(user); setModalType('project'); }}>Add Project</Button>
                  <Button onClick={() => { setSelectedUser(user); setModalType('tasks'); }}>Add Tasks</Button>
                  <Button onClick={() => { setSelectedUser(user); setModalType('payroll'); }}>Payroll</Button>
                </Actions>
              </Card>
            );
          })}
        </Grid>

        {/* Project Modal */}
        {modalType === 'project' && selectedUser && (
          <Modal>
            <ModalTitle>New Project for {selectedUser.name}</ModalTitle>
            <Form>
              <Label>Project ID</Label>
              <Input value={newProject.projectId} onChange={e => setNewProject(n => ({ ...n, projectId: e.target.value }))} />
              <Label>Name</Label>
              <Input value={newProject.name} onChange={e => setNewProject(n => ({ ...n, name: e.target.value }))} />
              <Label>Time (min)</Label>
              <Input type="number" value={newProject.timeAllocated} onChange={e => setNewProject(n => ({ ...n, timeAllocated: e.target.value }))} />
            </Form>
            <ModalFooter>
              <SaveButton onClick={addProject}>Save</SaveButton>
              <CancelButton onClick={resetModals}>Cancel</CancelButton>
            </ModalFooter>
          </Modal>
        )}

        {/* Tasks Modal */}
        {modalType === 'tasks' && selectedUser && (
          <Modal>
            <ModalTitle>Add Tasks to {selectedUser.name}</ModalTitle>
            <Form full>
              <Label>Enter tasks (one per line, optional numbering)</Label>
              <TextArea rows={6} value={newTasksText} onChange={e => setNewTasksText(e.target.value)} />
            </Form>
            <ModalFooter>
              <SaveButton onClick={addTasks}>Save Tasks</SaveButton>
              <CancelButton onClick={resetModals}>Cancel</CancelButton>
            </ModalFooter>
          </Modal>
        )}

        {/* Payroll Modal */}
        {modalType === 'payroll' && selectedUser && (
          <Modal>
            <ModalTitle>Payroll for {selectedUser.name}</ModalTitle>
            <Row>
              <Column>
                <Label>Period Start</Label>
                <Input type="date" value={newPayroll.periodStart} onChange={e => setNewPayroll(p => ({ ...p, periodStart: e.target.value }))} />
                <Label>Basic Salary</Label>
                <Input type="number" value={newPayroll.basicSalary} onChange={e => setNewPayroll(p => ({ ...p, basicSalary: e.target.value }))} />
                <Label>Allowances</Label>
                <Input type="number" value={newPayroll.allowances} onChange={e => setNewPayroll(p => ({ ...p, allowances: e.target.value }))} />
                <Label>Deductions</Label>
                <Input type="number" value={newPayroll.deductions} onChange={e => setNewPayroll(p => ({ ...p, deductions: e.target.value }))} />
                <Label>Loss of pay (no of days)</Label>
                <Input type="number" value={newPayroll.paidLeaves} onChange={e => setNewPayroll(p => ({ ...p, paidLeaves: e.target.value }))} />
              </Column>
              <Column>
                <Label>Period End</Label>
                <Input type="date" value={newPayroll.periodEnd} onChange={e => setNewPayroll(p => ({ ...p, periodEnd: e.target.value }))} />
                <Label>Overtime Rate</Label>
                <Input type="number" value={newPayroll.overtimeRate} onChange={e => setNewPayroll(p => ({ ...p, overtimeRate: e.target.value }))} />
                <Label>Overtime Hours</Label>
                <Input type="number" value={newPayroll.overtimeHours} onChange={e => setNewPayroll(p => ({ ...p, overtimeHours: e.target.value }))} />
                <Label>OD Rate</Label>
                <Input type="number" value={newPayroll.odRate} onChange={e => setNewPayroll(p => ({ ...p, odRate: e.target.value }))} />
                <Label>OD Hours</Label>
                <Input type="number" value={newPayroll.odHours} onChange={e => setNewPayroll(p => ({ ...p, odHours: e.target.value }))} />
                <Label>Tax Rate (%)</Label>
                <Input type="number" value={newPayroll.taxRate} onChange={e => setNewPayroll(p => ({ ...p, taxRate: e.target.value }))} />
              </Column>
            </Row>
            <SummaryCard>
              <SummaryRow><strong>Overtime Pay:</strong> ₹{overtimePay}</SummaryRow>
              <SummaryRow><strong>OD Pay:</strong> ₹{odPay}</SummaryRow>
              <SummaryRow><strong>Leave Deduction:</strong> ₹{leaveDeduction}</SummaryRow>
              <SummaryRow><strong>Gross Pay:</strong> ₹{grossPay}</SummaryRow>
              <SummaryRow><strong>Tax Amount:</strong> ₹{taxAmount}</SummaryRow>
              <SummaryRow><strong>Net Pay:</strong> ₹{netPay}</SummaryRow>
              <SummaryRow italic><em>{amountWords} Only</em></SummaryRow>
            </SummaryCard>
            <ModalFooter>
              <SaveButton onClick={addPayroll}>Save Payroll</SaveButton>
              <CancelButton onClick={resetModals}>Cancel</CancelButton>
            </ModalFooter>
          </Modal>
        )}
      </Container>

      <Footer />
    </Page>
  );
}

// Styled Components definitions below (unchanged)...

const CardBody = styled.div`
  padding: 1rem;
  flex: 1;
`;
const CardFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  gap: 0.5rem;
`;
// const CancelButton = styled(Button)`background:rgb(255,16,40);&:hover{background:rgb(221,0,22);}`;
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
`;
const ModalHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const ModalBody = styled.div`
  padding: 1rem;
  flex: 1;
  overflow: auto;
`;
const ModalFooter = styled.div`
  padding: 1rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;
const Close = styled.span`
  cursor: pointer;
  font-size: 1.5rem;
  line-height: 1;
`;
const P = styled.p`
  margin: 0.5rem 0;
`;
const Page = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;
const Container = styled.div`
  max-width: 1200px;
  margin: 6rem auto;
  padding: 2rem;
`;
const Title = styled.h2`
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #7620ff, #ff9900);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  text-align: center;
  @media (max-width: 600px) {
    font-size: 2rem;
    margin-bottom: 20px;
  }
`;
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;
const Card = styled.div`
  background: #fff;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
`;
const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;
const Badge = styled.span`
  background: #eee;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;
const Section = styled.div`
  margin-bottom: 1rem;
`;
const SectionTitle = styled.h4`
  margin: 0 0 0.5rem;
  color: #555;
`;
const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 80px;
  overflow-y: auto;
`;
const ListItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 0.2rem 0;
  border-bottom: 1px solid #f0f0f0;
`;
const Tag = styled.span`
  background: #7620ff;
  color: #fff;
  padding: 0 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;
const Actions = styled.div`
  margin-top: auto;
  display: flex;
  gap: 0.5rem;
`;
const Button = styled.button`
  flex: 1;
  padding: 0.5rem;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
  &:hover {
    background: #580cd2;
  }
`;
const CancelButton = styled.button`
  flex: 1;
  padding: 0.5rem;
  background:   #d32f2f;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.3s;
  &:hover {
    background: #580cd2;
  }
`;
const Modal = styled.div`
  position: fixed;
  top: 55%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 200;
  max-width: 900px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  @media (max-width: 768px) {
    padding: 1rem;
    top: 54%;
  }
`;
const ModalTitle = styled.h3`
  margin-top: 0;
  text-align: center;
  color: #333;
`;
const Form = styled.div`
  display: grid;
  grid-template-columns: ${(p) => (p.full ? "1fr" : "1fr 1fr")};
  gap: 1.2rem;
  margin-bottom: 1.5rem;
`;
const Row = styled.div`
  display: flex;
  gap: 1rem;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;
const Column = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;
const Label = styled.label`
  font-size: 0.9rem;
  color: #555;
`;
const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
`;
const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  resize: vertical;
`;
const SaveButton = styled(Button)`
  background: #7620ff;
  &:hover {
    background: #580cd2;
  }
`;
const SummaryCard = styled.div`
  background: #f7f7f7;
  padding: 1rem;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;
const SummaryRow = styled.div`
  ${(p) => (p.italic ? "font-style:italic;color:#555;" : "font-size:1rem;")}
`;
const SmallInfo = styled.div`
  font-size: 0.85rem;
  color: #777;
  text-align: center;
  margin-top: 0.5rem;
`;
