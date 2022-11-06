import React from "react";
import { createClient } from "@supabase/supabase-js";

import LoginForm from "./Components/LoginForm";
import { Route, Routes, Link } from "react-router-dom";

import { Divider, Layout, Menu, Col, Row, Avatar, Drawer } from "antd";
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
import "./App.css";
import ChangeFavouriteAirport from "./Components/ChangeFavouriteAirport";


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
      user: undefined,
      isOpen: false
    };
  }

  componentDidMount() {
    this.supabase.auth.getUser().then(({ data }) => {
      if(data?.user) this.onNewUser(data.user);
      else this.setState({ user: null });
    });

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
        email: user.email,
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

  onChangeFavouriteAirport(newFavouriteAirport) {
    this.setState({
      user: {
        ...this.state.user,
        airport: newFavouriteAirport,
      },
    });
  }

  openDrawer() {
    this.setState({
      isOpen: true
    })
    this.forceUpdate();
  }


  render() {
    const { Header, Content, Footer } = Layout;

    let menuItems = [
      {
        key: "/logo",
        paths: ["/", "/flights/search"],
        anon: true,
        auth: true,
        label: (
          <Link to="/">
            <img
              src="/dpiu_airlines/logo.svg"
              alt="logo"
              width="40"
              height="40"
            />
          </Link>
        ),
      },
      {
        key: "login",
        anon: true,
        auth: false,
        paths: ["/login"],
        label: <Link to="/login">Iniciar sesión</Link>,
        icon: <LoginOutlined />,
      },
      {
        key: "signup",
        anon: true,
        auth: false,
        paths: ["/signup"],
        label: <Link to="/signup">Registrarse</Link>,
        icon: <UserAddOutlined />,
      },
      {
        key: "history",
        anon: false,
        auth: true,
        paths: ["/user/history"],
        label: <Link to="/user/history">Historial de compras</Link>,
        icon: <HistoryOutlined />,
      },
    ];

    if (this.state.user === undefined) {
      menuItems = menuItems.filter((item) => item.anon && item.auth);
    } else if (this.state.user === null) {
      menuItems = menuItems.filter((item) => item.anon);
    } else {
      menuItems = menuItems.filter((item) => item.auth);
    }
    
    menuItems = menuItems.map((item) => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      paths: item.paths
    }));

    return (
      <Layout className="layout">
        <Header style={{ marginBottom: "2em" }}>
          <Row>
            <Col style={{ marginRight: "auto", width: "80%" }}>
              <Menu 
                theme="dark" 
                mode="horizontal" 
                items={menuItems} 
                selectedKeys={
                  menuItems
                    .filter((item) => item.paths.includes(this.props.location.pathname))
                    .map((item) => item.key)
                }>
              </Menu>
            </Col>
            {this.state.user && (
              <Col>
                <Avatar className="avatar" onClick={() => this.openDrawer()}>{this.state.user.email[0]}</Avatar>
              </Col>
            )}
          </Row>

        </Header>


        <Content
          style={{
            padding: "0 50px",
            width: "100%",
            maxWidth: "80rem",
            margin: "auto",
          }}
        >
          <Routes>
            <Route
              path="/login"
              element={
                <LoginForm
                  callBackOnFinishLoginForm={this.callBackOnFinishLoginForm}
                  showTitle={true}
                  redirectHome={true}
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
                <SearchFlight
                  airports={this.state.airports}
                  airlines={this.state.airlines}
                  supabase={this.supabase}
                  user={this.state.user}
                />
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
                  callBackOnFinishLoginForm={this.callBackOnFinishLoginForm}
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
        <Footer></Footer>
        {this.state.user && 
          <Drawer title={this.state.user.email} placement="right" onClose={() => this.setState({ isOpen: false })} open={this.state.isOpen}>
            <Divider>Selecciona tu aeropuerto favorito</Divider>
            <Row type="flex" justify="center"><ChangeFavouriteAirport onChange={this.onChangeFavouriteAirport.bind(this)} supabase={this.supabase} airports={this.state.airports} user={this.state.user} /></Row>
          </Drawer>
        }
      </Layout>
    );
  }
}
export default withRouter(App);
