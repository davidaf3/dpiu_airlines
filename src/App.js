import React from "react";
import { createClient } from "@supabase/supabase-js";

import LoginForm from "./Components/LoginForm";
import { Route, Routes, Link } from "react-router-dom";

import { Layout, Menu, Col, Row } from "antd";
import {
  UserAddOutlined,
  LoginOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

import FlightDetails from "./Components/FlightDetails";
import withRouter from "./Components/withRouter";
import TicketBuyPassengers from "./Components/TicketBuyPassengers";
import Home from "./Components/Home";
import SearchFlight from "./Components/SearchFlight";
import TicketHistory from "./Components/TicketHistory";
import SignUp from "./Components/SignUp";
import { getAirlines, getAirports, getFavouriteAirport } from "./api";

class App extends React.Component {
  constructor(props) {
    super(props);

    // opcional para poder personalizar diferentes aspectos
    const options = {
      schema: "public",
      headers: { "x-my-custom-header": "my-app-name" },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    };

    this.supabase = createClient(
      "https://gfhyobdofzshidbbnaxf.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmaHlvYmRvZnpzaGlkYmJuYXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjY4OTUwNzQsImV4cCI6MTk4MjQ3MTA3NH0.-MgTPuKPwfZ8xJbwoblznb9EZJUCxW6cFlYHvbjrCHs",
      options
    );

    this.state = {
      airports: new Map(),
      airlines: new Map(),
      user: null,
    };
  }

  componentDidMount() {
    this.supabase.auth.getUser().then(({ data }) => this.onNewUser(data.user));

    Promise.all([getAirlines(this.supabase), getAirports(this.supabase)]).then(
      ([airlines, airports]) => {
        this.setState({
          airports,
          airlines,
        });
      }
    );
  }

  async onNewUser(user) {
    const airport = (await getFavouriteAirport(this.supabase, user.id))[0]
      .airport;
    this.setState({
      user: {
        id: user.id,
        airport,
      },
    });
  }

  callBackOnFinishLoginForm = async (loginUser) => {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: loginUser.email,
      password: loginUser.password,
    });

    if (error == null && data.user != null) {
      this.onNewUser(data.user);
    }
  };

  callBackOnFinishSignUpForm = async (signUpUser) => {
    const { data, error } = await this.supabase.auth.signUp({
      email: signUpUser.email,
      password: signUpUser.password,
    });

    if (error == null && data.user != null) {
      this.onNewUser(data.user);
    }
  };

  render() {
    const { Header, Content } = Layout;

    let menuItems = [
      {
        key: "logo",
        label: (
          <Link to="/">
            <img src="/dpiu_airlines/logo.svg" width="40" height="40" />
          </Link>
        ),
      },
      {
        key: "anon_menuLogin",
        label: <Link to="/login">Inicar sesión</Link>,
        icon: <LoginOutlined />,
      },
      {
        key: "anon_menuSignup",
        label: <Link to="/signup">Registrarse</Link>,
        icon: <UserAddOutlined />,
      },
      {
        key: "auth_history",
        label: <Link to="/user/history">Historial de compras</Link>,
        icon: <HistoryOutlined />,
      },
    ];

    if (this.state.user === null) {
      menuItems = menuItems.filter(
        (element) => !element.key.startsWith("auth")
      );
    } else {
      menuItems = menuItems.filter(
        (element) => !element.key.startsWith("anon")
      );
    }

    return (
      <Layout className="layout">
        <Header style={{ marginBottom: "2em" }}>
          <Row>
            <Col style={{ marginRight: "auto", width: "80%" }}>
              <Menu theme="dark" mode="horizontal" items={menuItems}></Menu>
            </Col>
          </Row>
        </Header>

        <Content style={{ padding: "0 50px" }}>
          <Routes>
            <Route
              path="/login"
              element={
                <LoginForm
                  callBackOnFinishLoginForm={this.callBackOnFinishLoginForm}
                />
              }
            />
            <Route
              path="/signup"
              element={
                <SignUp
                  callBackOnFinishSignUpForm={this.callBackOnFinishSignUpForm}
                />
              }
            />
            <Route
              path="/"
              element={
                <Home
                  supabase={this.supabase}
                  airports={this.state.airports}
                  user={this.state.user}
                />
              }
            />
            <Route
              path="/flights/search"
              element={
                <SearchFlight supabase={this.supabase} user={this.state.user} />
              }
            />
            <Route
              path="/flights/:code"
              element={<FlightDetails supabase={this.supabase} />}
            />
            <Route
              path="/flights/buy_ticket"
              element={
                <TicketBuyPassengers
                  supabase={this.supabase}
                  user={this.state.user}
                />
              }
            />
            <Route
              path="/user/history"
              element={
                <TicketHistory
                  supabase={this.supabase}
                  airports={this.state.airports}
                  airlines={this.state.airlines}
                  user={this.state.user}
                />
              }
            />
          </Routes>
        </Content>
      </Layout>
    );
  }
}
export default withRouter(App);
