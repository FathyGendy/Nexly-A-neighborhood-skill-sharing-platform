using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSkillSwapFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExchangeServiceId",
                table: "Bookings",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_ExchangeServiceId",
                table: "Bookings",
                column: "ExchangeServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Services_ExchangeServiceId",
                table: "Bookings",
                column: "ExchangeServiceId",
                principalTable: "Services",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Services_ExchangeServiceId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_ExchangeServiceId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ExchangeServiceId",
                table: "Bookings");
        }
    }
}
