import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Offcanvas from 'react-bootstrap/Offcanvas';
import '../App.css';
import { Link } from "react-router-dom";

function OffcanvasExample() {
    const expand = 'sm';

    return (
        <Navbar expand={expand} className="custom-navbar">
            <Container fluid>
                <img
                    src="/image.png"  // If in public folder, use "/logo.png"
                    alt="Logo"
                    className="navbar-logo"
                />
                <Navbar.Brand href="#" className="p40-brand">UnderDogs</Navbar.Brand>
                <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${expand}`} />
                <Navbar.Offcanvas
                    id={`offcanvasNavbar-expand-${expand}`}
                    aria-labelledby={`offcanvasNavbarLabel-expand-${expand}`}
                    placement="end"
                >
                    <Offcanvas.Header closeButton>
                        <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${expand}`}>
                            Menu
                        </Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                        <Nav className="justify-content-end flex-grow-1 pe-3">
                            <Nav.Link as={Link} to="/dogs" className="option">Dogs</Nav.Link>
                            <Nav.Link as={Link} to="/adoption" className="option">Adoption</Nav.Link>
                            <Nav.Link as={Link} to="https://fundraise.givesmart.com/f/4yx1/n?vid=1hjs8q" className="option">Donation</Nav.Link>
                            <NavDropdown
                                title="Accounts"
                                id={`offcanvasNavbarDropdown-expand-${expand}`}
                                className="custom-dropdown"
                            >
                                <NavDropdown.Item href="#action4" className="user">Marshall</NavDropdown.Item>
                                <NavDropdown.Item href="#action5" className="user">Admin</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item href="#action6" className="user">
                                    Contact
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                        <Form className="d-flex">
                            <Form.Control
                                type="search"
                                placeholder="Search"
                                className="me-2"
                                aria-label="Search"
                            />
                            <Button className="custom-search-btn">Search</Button>
                        </Form>
                    </Offcanvas.Body>
                </Navbar.Offcanvas>
            </Container>
        </Navbar>
    );
}

export default OffcanvasExample;
