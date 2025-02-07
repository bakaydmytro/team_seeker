'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chat extends Model {

    static associate(models) {
      
      Chat.hasMany(models.Message, { foreignKey: "chat_id" });
    
      Chat.belongsToMany(models.User, {
        through: {
          model: models.Member,  
          unique: false, 
        },
        foreignKey: 'chat_id',
        otherKey: 'user_id',
      });

    }
  }
  
  Chat.init({
    isGroup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: true,
    },
  }, {
    sequelize,
    tableName: "chats",
    modelName: 'Chat',
    timestamps: true,
  });
  return Chat;
};