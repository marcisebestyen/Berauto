using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class ReturnDepotMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ReturnDepotId",
                table: "Rents",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rents_ReturnDepotId",
                table: "Rents",
                column: "ReturnDepotId");

            migrationBuilder.AddForeignKey(
                name: "FK_Rents_Depots_ReturnDepotId",
                table: "Rents",
                column: "ReturnDepotId",
                principalTable: "Depots",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rents_Depots_ReturnDepotId",
                table: "Rents");

            migrationBuilder.DropIndex(
                name: "IX_Rents_ReturnDepotId",
                table: "Rents");

            migrationBuilder.DropColumn(
                name: "ReturnDepotId",
                table: "Rents");
        }
    }
}
