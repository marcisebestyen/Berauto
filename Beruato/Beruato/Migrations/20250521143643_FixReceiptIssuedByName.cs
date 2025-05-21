using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Beruato.Migrations
{
    /// <inheritdoc />
    public partial class FixReceiptIssuedByName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Users_IssuedBy",
                table: "Receipts");

            migrationBuilder.RenameColumn(
                name: "IssuedBy",
                table: "Receipts",
                newName: "IssuedById");

            migrationBuilder.RenameIndex(
                name: "IX_Receipts_IssuedBy",
                table: "Receipts",
                newName: "IX_Receipts_IssuedById");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Users_IssuedById",
                table: "Receipts",
                column: "IssuedById",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Receipts_Users_IssuedById",
                table: "Receipts");

            migrationBuilder.RenameColumn(
                name: "IssuedById",
                table: "Receipts",
                newName: "IssuedBy");

            migrationBuilder.RenameIndex(
                name: "IX_Receipts_IssuedById",
                table: "Receipts",
                newName: "IX_Receipts_IssuedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Receipts_Users_IssuedBy",
                table: "Receipts",
                column: "IssuedBy",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
