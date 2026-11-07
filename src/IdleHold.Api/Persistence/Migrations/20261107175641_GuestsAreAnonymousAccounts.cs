using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IdleHold.Api.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class GuestsAreAnonymousAccounts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Old guest holds were reachable only by their id, which no route takes any more.
            migrationBuilder.Sql("DELETE FROM players WHERE account_id IS NULL;");

            migrationBuilder.AlterColumn<Guid>(
                name: "account_id",
                table: "players",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAnonymous",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAnonymous",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<Guid>(
                name: "account_id",
                table: "players",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");
        }
    }
}
