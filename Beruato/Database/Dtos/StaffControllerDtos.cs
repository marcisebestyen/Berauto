using System.Text.Json.Serialization;

namespace Services.Database.Dtos;

public class HandOverRequestDto
{
    /// <summary>
    /// A gépkocsi tényleges kiadásának dátuma és időpontja.
    /// (The actual date and time when the car was issued.)
    /// </summary>
    public DateTime ActualStart { get; set; }
}

public class TakeBackRequestDto
{
    /// <summary>
    /// A gépkocsi tényleges visszavételének dátuma és időpontja.
    /// (The actual date and time when the car was taken back.)
    /// </summary>
    public DateTime ActualEnd { get; set; }

    /// <summary>
    /// A gépkocsi kilométeróra-állása a visszavételkor.
    /// (The odometer reading of the car at the time of return.)
    /// </summary>
    public decimal EndingKilometer { get; set; }
    
    /// <summary>
    /// A visszavételi telephely azonosítója.
    /// (The identifier of the return depot.)
    /// </summary>
    [JsonPropertyName("returnDepotId")]
    public int ReturnDepotId { get; set; }
    
    /// <summary>
    /// Alternatív property név a frontend kompatibilitás miatt.
    /// Csak a model binding használja, a logika a ReturnDepotId-t használja.
    /// </summary>
    [JsonPropertyName("dropOffDepotId")]
    public int? DropOffDepotId 
    { 
        get => ReturnDepotId;
        set => ReturnDepotId = value ?? 0;
    }
}

public class RejectRentRequestDto
{
    /// <summary>
    /// Az elutasítás indoka (opcionális).
    /// (The reason for rejection (optional).)
    /// </summary>
    public string? Reason { get; set; }
}