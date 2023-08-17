import React from "react";
import { Navbar, Container, Nav } from "react-bootstrap";
import VersionDisplay from "../header/VersionDisplay";

function Header() {
  return (
    <Navbar bg="dark" variant="dark">
    <Container>
      <Navbar.Brand href="/">
      SYNDAT
      </Navbar.Brand>
    <Nav className="me-auto">
      <Nav.Link href="/input">Input</Nav.Link>
      <Nav.Link href="/" disabled>{">"}</Nav.Link>
      <Nav.Link href="/results">Results</Nav.Link>
    </Nav>
    <VersionDisplay/>
    </Container>
  </Navbar>
  );
}
export default Header;