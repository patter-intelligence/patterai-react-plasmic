import { Outlet } from 'react-router-dom';

export const Layout = () => {
  return (
    <>
      {/* <div className={styles.shellContainer}> */}
      <div>
        {/* <NavMenu /> */}
        <Outlet />
      </div>
      {/* <div> */}
      {/* <Legend /> */}
      {/* <Footer /> */}
      {/* </div> */}
      {/* </div> */}
    </>
  );
};
