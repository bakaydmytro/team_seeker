'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Member extends Model {

    static associate(models) {
      
      Member.associate = (models) => {
        Member.belongsTo(models.User, { foreignKey: "user_id" });
        Member.belongsTo(models.Chat, { foreignKey: "chat_id" });
      };

    }
  }
  
  Member.init({
    chat_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Chats", key: "id" },
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "Users", key: "id" },
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "user",
    },
  }, {
    sequelize,
    tableName: "Members",
    modelName: 'Member',
    timestamps: true,
  });
  return Member;
};