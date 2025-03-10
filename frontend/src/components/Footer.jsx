import { Facebook, Twitter, Instagram, LinkedIn } from "@mui/icons-material";
import { Code, Group, Layers, LocationOn } from "@mui/icons-material";

const Footer = () => {
  return (
    <footer className="bg-[#1E1E1E] text-white py-8 mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row items-start gap-10 px-6">
        
        {/* Social Media Icons */}
        <div className="flex flex-row space-x-4">
          <div className="text-orange-400 hover:text-pink-400 cursor-pointer">
            <Facebook fontSize="large" />
          </div>
          <div className="text-orange-400 hover:text-pink-400 cursor-pointer">
            <Twitter fontSize="large" />
          </div>
          <div className="text-orange-400 hover:text-pink-400 cursor-pointer">
            <Instagram fontSize="large" />
          </div>
        </div>

        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow">
          
          {/* Explore Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Code fontSize="small" /> Links
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href="#" className="text-yellow-400 text-decoration-none hover:text-pink-400 hover:no-underline">
                  Design
                </a>
              </li>
              <li>
                <a href="#" className="text-yellow-400 text-decoration-none hover:text-pink-400 hover:no-underline">
                  Prototyping
                </a>
              </li>
              <li>
                <a href="#" className="text-yellow-400 text-decoration-none hover:text-pink-400 hover:no-underline">
                  Development Features
                </a>
              </li>
              <li>
                <a href="#" className="text-yellow-400 text-decoration-none hover:no-underline">
                  Design Systems
                </a>
              </li>
            </ul>
          </div>

          {/* Location Section */}
          <div className="text-left">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LocationOn fontSize="small" className="text-green-400" /> Location
            </h3>
            <p className="mt-2 text-sm text-yellow-400">
              700 University Avenue,Monroe LA
            </p>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Group fontSize="small" className="text-red-400"/> Support
            </h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a href="#" className="text-yellow-400 text-decoration-none hover:text-pink-400 hover:no-underline">
                  Developers
                </a>
              </li>
              <li>
                <a href="#" className="text-yellow-400 text-decoration-none hover:text-pink-400 hover:no-underline">
                  Resource Library
                </a>
              </li>
            </ul>
          </div>

          {/* About Us Section */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers fontSize="small" className="text-green-400" /> About Us
            </h3>
            <p className="mt-2 text-sm text-white-400 text-justify">
              P-40 Underdogs is a shelter dog support platform dedicated to helping rescue dogs find loving homes. We offer scheduling for dog walks, adoption support, and resources for dog lovers.
            </p>
          </div>

        </div>
      </div>

      {/* Copyright Section */}
      <div className="mt-2 border-t border-gray-700 pt-4 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Underdogs | All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;