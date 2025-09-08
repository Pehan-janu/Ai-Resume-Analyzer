import React from 'react';
import { Link} from "react-router"; // Fixed import

// Option 1: Correct TypeScript syntax
const Navbar = () => {
    return (
        <nav className="navbar">
            <Link to="/">
                <p className="text-2xl font-bold text-gradient">RESUMIND</p>
            </Link>
            <Link to="/upload" className="primary-button w-fit">
                Upload Resume
            </Link>
        </nav>
    );
};

// Option 2: Alternative correct syntax
// const Navbar = (): JSX.Element => {
//     return (
//         <nav className="navbar">
//             <Link to="/">
//                 <p>RESUMIND</p>
//             </Link>
//         </nav>
//     );
// };

export default Navbar;