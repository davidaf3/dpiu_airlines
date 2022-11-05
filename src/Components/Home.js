import SearchFlightInput from "./SearchFlightInput";
import GetCheapestFlights from "./GetCheapestFlights";
import { useNavigate } from "react-router-dom";
import { serializeSearch } from "../searchSerialization";

export default function Home({ supabase, airports, user }) {
  const navigate = useNavigate();

  const searchFlights = (search) => {
    navigate({
      pathname: "/flights/search",
      search: "?" + serializeSearch(search).toString(),
    });
  };

  return (
    <div>
      <SearchFlightInput
        airports={airports}
        onSearch={searchFlights}
        user={user}
      ></SearchFlightInput>
      <GetCheapestFlights supabase={supabase} user={user} airports={airports} />
    </div>
  );
}
