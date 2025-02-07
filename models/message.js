'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {

    static associate(models) {
      
      Message.belongsTo(models.Chat, { foreignKey: "chat_id" });

      Message.belongsTo(models.User, { foreignKey: "sender_id" });

    }
  }
  
  Message.init({
    chat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read'),
      allowNull: false,
      defaultValue: "sent",
    },
  }, {
    sequelize,
    tableName: "Messages",
    modelName: 'Message',
    timestamps: true,
  });
  return Message;
};