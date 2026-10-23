import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import VersionDisplay from "../header/VersionDisplay";

function Header() {
  return (
    <Navbar className="app-navbar" sticky="top">
      <Container>
        <Navbar.Brand href="/" className="app-navbar__brand" aria-label="SYNDAT Dashboard">
          <img src="/brand/syndat_dashboard.svg" alt="syndat Dashboard" />
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="/input">Input</Nav.Link>
          <Nav.Link href="/" disabled>
            {">"}
          </Nav.Link>
          <Nav.Link href="/results">Results</Nav.Link>
        </Nav>
        <Nav className="app-navbar__helpdesk">
          <Nav.Link href="https://www.nfdi4health.de/en/helpdesk.html">
            Helpdesk
          </Nav.Link>
        </Nav>
        <VersionDisplay />
      </Container>
    </Navbar>
  );
}
export default Header;