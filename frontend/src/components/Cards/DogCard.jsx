import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendar, faHeart, faWalking, faBook } from '@fortawesome/free-solid-svg-icons';

function DogCard({dog}) {
    return (
        <div className="card h-100 shadow-sm">
            <div className="position-relative">
                <img src={dog.image} className="card-img-top" alt={dog.name} style={{height: '200px', objectFit: 'cover'}} />
                <span className={`position-absolute top-0 end-0 m-2 badge ${dog.availableForWalk ? 'bg-success' : 'bg-danger'}`}>
                    {dog.availableForWalk ? 'Available' : 'Not Available'}
                </span>
            </div>
            
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0">{dog.name}</h5>
                    <span className="badge bg-info">{dog.label}</span>
                </div>

                <div className="mb-3">
                    <p className="mb-1">
                        <FontAwesomeIcon icon={faPaw} className="me-2" />
                        {dog.breed} • {dog.age} years • {dog.color}
                    </p>
                    <p className="mb-1">
                        <FontAwesomeIcon icon={faWalking} className="me-2" />
                        Walks: {dog.numberOfWalks}
                    </p>
                    <p className="mb-1">
                        <FontAwesomeIcon icon={faCalendar} className="me-2" />
                        Next walk: {new Date(dog.nextScheduledWalk).toLocaleDateString()}
                    </p>
                </div>

                <div className="mb-3">
                    <p className="small text-muted">
                        <FontAwesomeIcon icon={faBook} className="me-2" />
                        {dog.notes}
                    </p>
                </div>

                <div className="d-flex flex-column gap-2">
                    <button className="btn btn-primary">
                        Request Walk
                    </button>
                    <button className="btn btn-outline-secondary btn-sm">
                        <FontAwesomeIcon icon={faHeart} className="me-1" />
                        View Details
                    </button>
                </div>
            </div>
            
            <div className="card-footer text-muted small">
                Last updated: {new Date(dog.lastUpdated).toLocaleDateString()}
            </div>
        </div>
    );
}

export default DogCard;