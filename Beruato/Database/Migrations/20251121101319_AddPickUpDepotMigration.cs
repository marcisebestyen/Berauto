using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Database.Migrations
{
    /// <inheritdoc />
    public partial class AddPickUpDepotMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PickUpDepotId",
                table: "Rents",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Rents_PickUpDepotId",
                table: "Rents",
                column: "PickUpDepotId");

            migrationBuilder.AddForeignKey(
                name: "FK_Rents_Depots_PickUpDepotId",
                table: "Rents",
                column: "PickUpDepotId",
                principalTable: "Depots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Rents_Depots_PickUpDepotId",
                table: "Rents");

            migrationBuilder.DropIndex(
                name: "IX_Rents_PickUpDepotId",
                table: "Rents");

            migrationBuilder.DropColumn(
                name: "PickUpDepotId",
                table: "Rents");
        }
    }
}
