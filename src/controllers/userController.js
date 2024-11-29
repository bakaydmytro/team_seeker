//controllers/userController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const axios = require('axios');
const { Game, User } = require('../../models');
const SteamAuth = require('node-steam-openid');

const steam = new SteamAuth({
  realm: 'http://localhost:5000', 
  returnUrl: 'http://localhost:5000/api/users/steam/authenticate', 
  apiKey: process.env.STEAM_API_KEY,
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, birthday, password } = req.body;

  if (!username || !email || !birthday || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }
  const userExists = await User.findOne({
    where: { email }
  });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    username,
    email,
    birthday,
    password: hashedPassword,
  });

  if (user) {
    req.session.userId = user.id;
    res.status(201).json({
      _id: user.id,
      name: user.username,
      email: user.email,
      birthday: user.birthday,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please add all fields");
  }
  const user = await User.findOne({where: { email }});

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    req.session.userId = user.id;
    res.json({
      _id: user.id,
      name: user.username,
      email: user.email,
      birthday: user.birthday,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid credentials");
  }
});


const getLoggedInUser = asyncHandler(async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401);
    throw new Error("Not authenticated");
  }

  const user = await User.findByPk(userId, {
    attributes: ["id", "username", "email", "birthday"],
  });

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});


const steamLogin = asyncHandler(async (req, res) => {
  try {
    const redirectUrl = await steam.getRedirectUrl();

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error initiating Steam login:", error);
    res.status(500).json({ 
      message: "Unable to initiate Steam login. Please try again later." 
    });
  }
});



const steamRedirect = asyncHandler(async (req, res) => {
  try {
    const steamUser = await steam.authenticate(req);
    const steamId = steamUser._json.steamid;
    const personaname = steamUser._json.personaname;
    const profileUrl = steamUser._json.profileurl;
    const avatarUrl = steamUser._json.avatarfull; 
    const gameNowPlaying = steamUser._json.gameextrainfo || "No game currently playing"; 

    console.log(steamUser._json);  

    if (!personaname) {
      throw new Error("Missing personaname in Steam user data");
    }

    if (!steamId) {
      throw new Error("Missing steamid in Steam user data");
    }

    
    let user = await User.findOne({ where: { steamid: steamId } });

    if (!user) {
      user = await User.create({
        username: personaname,
        steamid: steamId,
        password: steamId,
        profile_url: profileUrl,
        avatar_url: avatarUrl,
        game_now_playing: gameNowPlaying, 
      });
    } else {
      user = await user.update({
        avatar_url: avatarUrl,
        game_now_playing: gameNowPlaying,
      });
    }

    const token = generateToken(user.id);
    req.session.username = user.username;

    res.status(200).json({
      message: "Authentication successful",
      user: {
        _id: user.id,
        username: user.username,
        steamid: user.steamid,
        profile_url: user.profile_url,
        avatar_url: user.avatar_url,
        game_now_playing: user.game_now_playing,
        token: token,
        redirectUrl: "http://localhost:3000/dashboard",
      },
    });
  } catch (error) {
    console.error("Error during Steam authentication:", error);

    res.status(500).json({
      message: "Steam authentication failed. Please try again later.",
    });
  }
});

const allowedGames = [730, 570, 440]; // CS2, Dota 2, Team Fortress 2

const getRecentlyPlayedGames = async (req, res) => {
  try {
    const { steamid } = req.body; 
    const apiKey = process.env.STEAM_API_KEY;

    const url = `http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${apiKey}&steamid=${steamid}&format=json`;

    const response = await axios.get(url);
    const { games, total_count } = response.data.response;

    if (!games || total_count === 0) {
      return res.status(404).json({ message: "No recently played games found" });
    }

    const user = await User.findOne({ where: { steamid } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    const filteredGames = games.filter((game) =>
      allowedGames.includes(game.appid)
    );

    if (filteredGames.length === 0) {
      return res
        .status(404)
        .json({ message: "No allowed games found in recently played games" });
    }

    
    const gameRecords = filteredGames.map((game) => ({
      appid: game.appid,
      name: game.name,
      playtime_2weeks: game.playtime_2weeks || null,
      playtime_forever: game.playtime_forever,
      img_icon_url: game.img_icon_url,
      img_logo_url: game.img_logo_url,
      user_id: user.id,
    }));

   
    await Game.bulkCreate(gameRecords, { ignoreDuplicates: true });

    res
      .status(200)
      .json({ message: "Filtered games saved successfully", games: filteredGames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch games", error });
  }
};




module.exports = {
  registerUser,
  loginUser,
  getLoggedInUser,
  steamLogin,
  steamRedirect,
  getRecentlyPlayedGames,
};




