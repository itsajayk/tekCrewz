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

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "students"));
        const students = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // console.log("Fetched student data:", data); 
          // Only include students who have completed the quiz
          if (data.quizCompleted) {
            students.push({ id: docSnap.id, ...data });
          }
        });
        // console.log("Students with quizCompleted:", students); 
        setReportData(students);
      } catch (error) {
        console.error("Error fetching student data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Student Quiz Report", 10, 15);
    
    let y = 25;
    doc.setFontSize(12);
    doc.text("S.No", 10, y);
    doc.text("Student RegID", 30, y);
    doc.text("Name", 70, y);
    doc.text("Score", 140, y);
    doc.text("Completed", 170, y);
    y += 8;
    doc.line(10, y, 200, y);
    y += 5;
    
    reportData.forEach((student, index) => {
      const regID = student.studentRegID || student.id || "N/A";
      const name = student.name || "N/A";
      const score = student.score !== undefined ? student.score.toString() : "N/A";
      const completed = student.quizCompleted ? "Yes" : "No";
      
      doc.text(`${index + 1}`, 10, y);
      doc.text(regID, 30, y);
      doc.text(name, 70, y);
      doc.text(score, 140, y);
      doc.text(completed, 170, y);
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
            <TableContainer>
              <Table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student RegID</th>
                    <th>Name</th>
                    <th>Score</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.studentRegID || "N/A"}</td>
                      <td>{student.name || "N/A"}</td>
                      <td>{student.score !== undefined ? student.score : "N/A"}</td>
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
              <i className="fa-solid fa-circle-check fa-bounce" style={{ color: "#14a800" }}></i>
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

// Styled Components

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

const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  max-width: 100%;
  border-collapse: collapse;
  th, td {
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
    th, td {
      padding: 10px;
      font-size: 12px;
    }
  }
  @media (max-width: 480px) {
    th, td {
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
