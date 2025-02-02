import React, { useEffect, useState } from "react";
import DogCard from "../components/Cards/DogCard";
import { Container, Row, Col, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faDog } from '@fortawesome/free-solid-svg-icons';

const Dogs = () => {
  const [dogs, setDogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDogs = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/dogs");
        const data = await response.json();
        setDogs(data);
      } catch (err) {
        setError("Failed to fetch dogs");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDogs();
  }, []);

  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center min-vh-100">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="text-center py-5">
        <h3 className="text-danger">{error}</h3>
      </Container>
    );
  }

  return (
    <Container fluid="lg" className="px-4 py-5">
      {/* Header Section */}
      <Row className="justify-content-center mb-5">
        <Col xs={12} md={8} lg={6} className="text-center">
          <h1 className="display-4 mb-3">
            <FontAwesomeIcon icon={faDog} className="me-3" />
            Available Dogs
          </h1>
          <p className="lead text-muted px-2">
            Help make a difference in a dog's life by becoming a volunteer walker
          </p>
        </Col>
      </Row>

      {/* Search Section */}
      <Row className="justify-content-center mb-4">
        <Col xs={12} md={8} lg={6}>
          <InputGroup className="shadow-sm">
            <InputGroup.Text className="bg-white border-end-0">
              <FontAwesomeIcon icon={faSearch} className="text-muted" />
            </InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search dogs by name or breed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-start-0 ps-0"
            />
          </InputGroup>
        </Col>
      </Row>

      {/* Dogs Grid */}
      <Row xs={1} sm={2} md={2} lg={3} xl={4} className="g-4">
        {dogs
          .filter(dog => 
            dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dog.breed.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((dog) => (
            <Col key={dog.id} className="d-flex align-items-stretch">
              <DogCard dog={dog} />
            </Col>
          ))}
      </Row>

      {/* Empty State */}
      {dogs.length === 0 && (
        <Row className="justify-content-center py-5">
          <Col xs={12} className="text-center">
            <h3>No dogs available at the moment</h3>
            <p className="text-muted">Please check back later for updates</p>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default Dogs;
