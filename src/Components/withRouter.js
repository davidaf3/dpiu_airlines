import React from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
 
const withRouter = WrappedComponent => props => {
  const params = useParams();
  const navigate   = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  return (
    <WrappedComponent
      {...props}
      params={params}
      navigate ={navigate}
      searchParams={searchParams}
      setSearchParams={setSearchParams}
      location={location}
    />
  );
};
 
export default withRouter;

