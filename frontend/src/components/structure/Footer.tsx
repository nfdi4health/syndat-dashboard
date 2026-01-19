import React from "react";
import { Navbar, Container, Nav, Col, Row } from "react-bootstrap";
import "./Footer.css"

function Footer() {
  return (
    <Navbar id="footer">
      <Container>
        <Nav className="me-auto">
          <Row>
            <Col>
              <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Contact</Nav.Link>
            </Col>
            <Col>
              <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Imprint</Nav.Link>
            </Col>
            <Col>
              <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Terms & Conditions</Nav.Link>
            </Col>
            <Col>
              <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Data Protection Information</Nav.Link>
            </Col>
          </Row>
        </Nav>
      </Container>
    </Navbar>
  );
}
export default Footer;