import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import { Github } from "react-bootstrap-icons";
import "./Footer.css";

const GITHUB_URL = "https://github.com/nfdi4health/syndat-dashboard";

function Footer() {
  return (
    <Navbar id="footer">
      <Container className="footer__inner">
        <Nav className="footer__links">
          <Nav.Link href="https://www.nfdi4health.de/en/helpdesk.html">Helpdesk</Nav.Link>
          <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Contact</Nav.Link>
          <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Imprint</Nav.Link>
          <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Terms &amp; Conditions</Nav.Link>
          <Nav.Link href="https://www.scai.fraunhofer.de/en/business-research-areas/bioinformatics/fields-of-research/AI-DAS.html">Data Protection Information</Nav.Link>
        </Nav>
        <a
          className="footer__github"
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          title="View the source on GitHub"
        >
          <Github aria-hidden="true" />
        </a>
      </Container>
    </Navbar>
  );
}
export default Footer;
