import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaw, faCalendar, faHeart, faWalking } from '@fortawesome/free-solid-svg-icons';
import './DogCard.css';

function DogCard({dog}) {
    return (
        <div className="card h-100 shadow-sm" style={{ backgroundColor: 'var(--white)' }}>
            <div className="position-relative">
                <img src={dog.image} className="card-img-top" alt={dog.name} 
                    style={{height: '200px', objectFit: 'cover'}} />
                <span className={`position-absolute top-0 end-0 m-2 badge ${
                    dog.availableForWalk ? 'available-badge' : 'unavailable-badge'}`}>
                    {dog.availableForWalk ? 'Available' : 'Not Available'}
                </span>
            </div>
            
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="card-title mb-0" style={{ color: 'var(--marron)' }}>{dog.name}</h5>
                    <span className="badge" style={{ backgroundColor: 'var(--yellow)' }}>{dog.label}</span>
                </div>

                <div className="mb-3 dog-info">
                    <p className="mb-1">
                        <FontAwesomeIcon icon={faPaw} className="me-2" style={{ color: 'var(--marron)' }}/>
                        {dog.breed} • {dog.age} years • {dog.color}
                    </p>
                    <p className="mb-1">
                        <FontAwesomeIcon icon={faWalking} className="me-2" style={{ color: 'var(--marron)' }}/>
                        Walks: {dog.numberOfWalks}
                    </p>
                    <p className="mb-1">
                        <FontAwesomeIcon icon={faCalendar} className="me-2" style={{ color: 'var(--marron)' }}/>
                        Next walk: {new Date(dog.nextScheduledWalk).toLocaleDateString()}
                    </p>
                </div>

                <div className="d-flex flex-column gap-2">
                    <button className="btn primary-btn">
                        Request Walk
                    </button>
                    <button className="btn secondary-btn">
                        <FontAwesomeIcon icon={faHeart} className="me-1" />
                        View Details
                    </button>
                </div>
            </div>
            
            <div className="card-footer" style={{ backgroundColor: 'var(--lightbackground)' }}>
                Last updated: {new Date(dog.lastUpdated).toLocaleDateString()}
            </div>
        </div>
    );
}

export default DogCard;