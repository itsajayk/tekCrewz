import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { jsPDF } from "jspdf";
import TopNavbar from "../Nav/TopNavbar";
import Footer from "../Sections/Footer";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Pages/firebase";

const AdminReport = () => {
  const [reportData, setReportData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const students = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.quizCompleted) {
            // Fallback: data.attendedDate should be a Firestore Timestamp
            const attendedDate = data.attendedDate?.toDate
              ? data.attendedDate.toDate()
              : data.attendedDate
                ? new Date(data.attendedDate)
                : null;

            students.push({
              id: docSnap.id,
              studentRegID: data.studentRegID,
              name: data.name,
              score: data.score,
              quizCompleted: data.quizCompleted,
              attendedDate,
            });
          }
        });
        setReportData(students);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredData = reportData.filter((student) => {
    if (!startDate && !endDate) return true;
    if (!student.attendedDate) return true;

    const d = new Date(student.attendedDate);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (startDate && dateOnly < new Date(startDate)) return false;
    if (endDate && dateOnly > new Date(endDate)) return false;
    return true;
  });

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Student Quiz Report", 10, 15);

    let y = 25;
    doc.setFontSize(12);
    doc.text("S.No", 10, y);
    doc.text("RegID", 25, y);
    doc.text("Name", 65, y);
    doc.text("Score", 120, y);
    doc.text("Attended", 150, y);
    doc.text("Completed", 185, y);

    y += 8;
    doc.line(10, y, 200, y);
    y += 5;

    filteredData.forEach((student, idx) => {
      const regID = student.studentRegID || student.id || "N/A";
      const name = student.name || "N/A";
      const score = student.score != null ? student.score.toString() : "N/A";
      const completed = student.quizCompleted ? "Yes" : "No";
      const dateStr = student.attendedDate
        ? student.attendedDate.toLocaleDateString()
        : "N/A";

      doc.text(`${idx + 1}`, 10, y);
      doc.text(regID, 25, y);
      doc.text(name, 65, y);
      doc.text(score, 120, y);
      doc.text(dateStr, 150, y);
      doc.text(completed, 185, y);

      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save("quiz_report.pdf");
    setPdfSuccess(true);
    setTimeout(() => setPdfSuccess(false), 3000);
  };

  return (
    <Wrapper>
      <TopNavbar />
      <Content>
        <Title>Admin Report</Title>

        {isLoading ? (
          <LoadingMessage>Loading...</LoadingMessage>
        ) : (
          <>
            <FilterContainer>
              <label>
                From:{" "}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </label>
              <label>
                To:{" "}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </label>
            </FilterContainer>

            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student RegID</th>
                    <th>Name</th>
                    <th>Score</th>
                    {/* <th>Attended Date</th> */}
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((student, idx) => (
                    <tr key={student.id}>
                      <td>{idx + 1}</td>
                      <td>{student.studentRegID || "N/A"}</td>
                      <td>{student.name || "N/A"}</td>
                      <td>
                        {student.score != null ? student.score : "N/A"}
                      </td>
                      {/* <td>
                        {student.attendedDate
                          ? student.attendedDate.toLocaleDateString()
                          : "N/A"}
                      </td> */}
                      <td>{student.quizCompleted ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>

            <GenerateButton onClick={generatePDF}>
              Generate PDF Report
            </GenerateButton>
          </>
        )}
      </Content>
      <Footer />

      {pdfSuccess && (
        <SuccessModalOverlay>
          <SuccessModalContent>
            <SuccessTitle>
              PDF Generated Successfully!{" "}
              <i
                className="fa-solid fa-circle-check fa-bounce"
                style={{ color: "#14a800" }}
              />
            </SuccessTitle>
            <ModalCloseButton onClick={() => setPdfSuccess(false)}>
              Close
            </ModalCloseButton>
          </SuccessModalContent>
        </SuccessModalOverlay>
      )}
    </Wrapper>
  );
};

export default AdminReport;

// ——————————————————
// Styled Components
// ——————————————————

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Content = styled.div`
  flex: 1;
  max-width: 1000px;
  margin: 80px auto;
  padding: 20px;

  @media (max-width: 1024px) {
    margin: 60px auto;
  }
  @media (max-width: 768px) {
    padding: 15px;
    margin: 50px auto;
  }
  @media (max-width: 480px) {
    padding: 10px 5px;
    margin: 40px auto;
  }
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 2rem;

  @media (max-width: 768px) {
    font-size: 1.6rem;
  }
  @media (max-width: 480px) {
    font-size: 1.4rem;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;

  label {
    font-size: 14px;

    input {
      margin-left: 8px;
      padding: 4px;
    }
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: center;
    font-size: 14px;
  }

  th {
    background-color: #f3f3f3;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  @media (max-width: 768px) {
    th,
    td {
      padding: 10px;
      font-size: 12px;
    }
  }
  @media (max-width: 480px) {
    th,
    td {
      padding: 8px;
      font-size: 11px;
    }
  }
`;

const GenerateButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #580cd2;
  }
`;

const LoadingMessage = styled.p`
  text-align: center;
  font-size: 18px;
  color: #555;
`;

const SuccessModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const SuccessModalContent = styled.div`
  background: #fff;
  padding: 20px 30px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
`;

const SuccessTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 10px;
`;

const ModalCloseButton = styled.button`
  margin-top: 15px;
  padding: 8px 16px;
  background: #7620ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #580cd2;
  }
`;
