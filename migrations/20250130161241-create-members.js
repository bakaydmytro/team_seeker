'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Members', {
      chat_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Chats', 
          key: 'id',
        },
        onDelete: 'CASCADE', 
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
          references: {
            model: 'Users', 
            key: 'id',
          },
          onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "user", 
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Members');
  }
};