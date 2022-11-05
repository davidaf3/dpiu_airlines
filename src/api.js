import moment from "moment";

export async function getAirports(supabase) {
  const { data } = await supabase.from("airport").select("code, name, country, city");
  return new Map(data.map((airport) => [airport.code, airport]));
}

export async function getAirlines(supabase) {
  const { data } = await supabase.from("airline").select("id, name, image");
  return new Map(data.map((airline) => [airline.id, airline]));
}

export async function getFavouriteAirport(supabase, userId) {
  const { data } = await supabase
    .from("user")
    .select("airport")
    .eq("id", userId);
  return data;
}

export async function getTicketHistory(supabase, user) {
  const { data } = await supabase
    .from("ticket_with_flight")
    .select("*")
    .eq("user", user);

  const flights = [];
  const flightsMap = new Map();
  data.forEach((row) => {
    const flightKey = row.flight_code + row.created_at.substring(0, 16);

    const ticket = {
      key: row.id,
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      row: row.row,
      column: row.column,
      price: row.price,
      departure: moment(row.departure),
    };

    if (flightsMap.has(flightKey)) {
      const flight = flightsMap.get(flightKey);
      flight.tickets.push(ticket);
      flight.price += ticket.price;
      return;
    }

    const flight = {
      key: flightKey,
      code: row.flight_code,
      buyDate: moment(row.created_at),
      origin: row.origin,
      destination: row.destination,
      airline: row.airline,
      departure: moment(row.departure),
      arrival: moment(row.arrival),
      price: ticket.price,
      tickets: [ticket],
    };

    flights.push(flight);
    flightsMap.set(flightKey, flight);
  });
  return flights.sort((f1, f2) => -f1.buyDate.diff(f2.buyDate));
}

export async function returnTickets(supabase, ids) {
  const { error } = await supabase.from("ticket").delete().in("id", ids);
  return error;
}

function searchToSingleFlightQueryArgs(search) {
  return {
    origin_arg: search.origin,
    destination_arg: search.destination,
    passengers: search.passengers,
    departure_min: search.date.format("YYYY-MM-DD"),
    departure_max: moment(search.date).add(1, "day").format("YYYY-MM-DD"),
  };
}

function searchToRoundTripQueryArgs(search) {
  return {
    origin_arg: search.origin,
    destination_arg: search.destination,
    passengers: search.passengers,
    departure_departure_min: search.dates[0].format("YYYY-MM-DD"),
    departure_departure_max: moment(search.dates[0])
      .add(1, "day")
      .format("YYYY-MM-DD"),
    return_departure_min: search.dates[1].format("YYYY-MM-DD"),
    return_departure_max: moment(search.dates[1])
      .add(1, "day")
      .format("YYYY-MM-DD"),
  };
}

function singleFlightQuery(supabase, args, search, filters) {
  const query = supabase
    .from("flight_with_seats")
    .select("*")
    .eq("origin", args.origin_arg)
    .eq("destination", args.destination_arg)
    .gte("available_seats", args.passengers)
    .gte("departure", args.departure_min)
    .lt("departure", args.departure_max);

  if (filters) {
    query
      .in("airline", filters.airlines)
      .gte(
        "departure",
        moment(search.date).add(filters.hour[0], "hour").format()
      )
      .lte(
        "departure",
        moment(search.date).add(filters.hour[1], "hour").format()
      );
  }

  return query;
}

function roundTripQuery(supabase, args, search, filters) {
  const query = supabase
    .from("round_trip")
    .select("*")
    .eq("departure_origin", args.origin_arg)
    .eq("departure_destination", args.destination_arg)
    .gte("departure_available_seats", args.passengers)
    .gte("departure_departure", args.departure_departure_min)
    .lt("departure_departure", args.departure_departure_max)
    .gte("return_available_seats", args.passengers)
    .gte("return_departure", args.return_departure_min)
    .lt("return_departure", args.return_departure_max);

  if (filters) {
    query
      .in("departure_airline", filters.airlines)
      .in("return_airline", filters.airlines)
      .gte(
        "departure_departure",
        moment(search.dates[0]).add(filters.departure_hour[0], "hour").format()
      )
      .lte(
        "departure_departure",
        moment(search.dates[0]).add(filters.departure_hour[1], "hour").format()
      )
      .gte(
        "return_departure",
        moment(search.dates[1]).add(filters.return_hour[0], "hour").format()
      )
      .lte(
        "return_departure",
        moment(search.dates[1]).add(filters.return_hour[1], "hour").format()
      );
  }

  return query;
}

export async function searchSingleFlightAndMetadata(
  supabase,
  search,
  order,
  filters
) {
  const args = searchToSingleFlightQueryArgs(search);
  const flightsQuery = singleFlightQuery(supabase, args, search, filters).order(
    order.col,
    { ascending: order.asc }
  );
  const cheapestQuery = singleFlightQuery(supabase, args, search, null)
    .order("base_price", { ascending: true })
    .limit(1);
  const shortestQuery = singleFlightQuery(supabase, args, search, null)
    .order("duration", { ascending: true })
    .limit(1);
  let airportsQuery = supabase.rpc("get_distinct_airline_single_flight", args);
  let hoursQuery = supabase.rpc("get_min_max_hours_single_flight", args);

  let responses = await Promise.all([
    flightsQuery,
    airportsQuery,
    hoursQuery,
    cheapestQuery,
    shortestQuery,
  ]);
  responses = responses.map((response) => response.data);

  responses[1] = responses[1].map((el) => el.airline);

  const hours = responses[2];
  responses[2] = {
    min: moment(hours.min).get("hour"),
    max: moment(hours.max).get("hour") + 1,
  };

  responses[3] = responses[3][0];
  responses[4] = responses[4][0];

  return responses;
}

export async function searchSingleFlight(supabase, search, order, filters) {
  const args = searchToSingleFlightQueryArgs(search);
  const { data } = await singleFlightQuery(
    supabase,
    args,
    search,
    filters
  ).order(order.col, { ascending: order.asc });
  return data;
}

export async function searchRoundTripAndMetadata(
  supabase,
  search,
  order,
  filters
) {
  const args = searchToRoundTripQueryArgs(search);
  const flightsQuery = roundTripQuery(supabase, args, search, filters).order(
    order.col,
    { ascending: order.asc }
  );
  const cheapestQuery = roundTripQuery(supabase, args, search, null)
    .order("base_price", { ascending: true })
    .limit(1);
  const shortestQuery = roundTripQuery(supabase, args, search, null)
    .order("duration", { ascending: true })
    .limit(1);
  let airportsQuery = supabase.rpc("get_distinct_airline_round_trip", args);
  let hoursQuery = supabase.rpc("get_min_max_hours_round_trip", args);

  let responses = await Promise.all([
    flightsQuery,
    airportsQuery,
    hoursQuery,
    cheapestQuery,
    shortestQuery,
  ]);
  responses = responses.map((response) => response.data);

  responses[0] = responses[0].map(resoltToRoundTrip);
  responses[1] = responses[1].map((el) => el.airline);

  const hours = responses[2];
  responses[2] = {
    departure: {
      min: moment(hours.departure_min).get("hour"),
      max: moment(hours.departure_max).get("hour") + 1,
    },
    return: {
      min: moment(hours.return_min).get("hour"),
      max: moment(hours.return_max).get("hour") + 1,
    },
  };

  responses[3] = responses[3][0];
  responses[4] = responses[4][0];

  return responses;
}

export async function searchRoundTrip(supabase, search, order, filters) {
  const args = searchToRoundTripQueryArgs(search);
  const { data } = await roundTripQuery(supabase, args, search, filters).order(
    order.col,
    { ascending: order.asc }
  );
  const flights = data.map(resoltToRoundTrip);
  return flights;
}

function resoltToRoundTrip(result) {
  const trip = {
    departure: {},
    return: {},
    base_price: result.base_price,
    duration: result.duration,
  };

  Object.keys(result).forEach((key) => {
    if (key.startsWith("departure"))
      trip.departure[key.replace("departure_", "")] = result[key];
    else if (key.startsWith("return"))
      trip.return[key.replace("return_", "")] = result[key];
  });

  return trip;
}
