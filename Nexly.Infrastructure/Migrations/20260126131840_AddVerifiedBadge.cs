using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Nexly.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVerifiedBadge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVerifiedNeighbor",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "VouchesCount",
                table: "AspNetUsers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVerifiedNeighbor",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "VouchesCount",
                table: "AspNetUsers");
        }
    }
}
