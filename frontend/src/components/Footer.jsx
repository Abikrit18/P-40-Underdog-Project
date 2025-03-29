import { Facebook, Twitter, Instagram } from "@mui/icons-material";
import { LocationOn, Email, Phone } from "@mui/icons-material";
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-gray-200 py-6 mt-auto">
      <div className="container mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Brand Section */}
          <div>
            <img src="/image.png" alt="Underdogs Logo" className="h-12 w-auto mb-2 bg-white rounded p-1" />
            <div className="flex space-x-4 mt-2">
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">
                <Facebook fontSize="small" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">
                <Twitter fontSize="small" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">
                <Instagram fontSize="small" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-sm font-bold mb-2">Quick Links</h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link to="/walk" className="text-gray-300 hover:text-white transition-colors duration-300">
                  Schedule a Walk
                </Link>
              </li>
              <li>
                <Link to="/dogs" className="text-gray-300 hover:text-white transition-colors duration-300">
                  Available Dogs
                </Link>
              </li>
              <li>
                <Link to="/adoption" className="text-gray-300 hover:text-white transition-colors duration-300">
                  Adoption Process
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white text-sm font-bold mb-2">Contact Us</h3>
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-1 text-gray-300">
                <LocationOn fontSize="small" className="text-gray-400" />
                700 University Ave, Monroe LA
              </li>
              <li className="flex items-center gap-1 text-gray-300">
                <Email fontSize="small" className="text-gray-400" />
                contact@underdogs.com
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white text-sm font-bold mb-2">Newsletter</h3>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Enter email"
                className="w-full px-3 py-1.5 text-sm bg-gray-700 rounded 
                          placeholder-gray-400 text-white
                          focus:outline-none focus:ring-2 focus:ring-maroon
                          focus:bg-gray-600"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-maroon text-white rounded text-sm font-medium
                         hover:bg-red-900 transition-colors duration-300"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-gray-400 text-xs">
          <p>&copy; {new Date().getFullYear()} Underdogs | All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
