namespace Database.Models;

public enum Status
{
    Active,
    Notified, 
    Booked, 
    Canceled
}

public class WaitingList
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int CarId { get; set; }
    public int QueuePosition { get; set; }
    public DateTime QueuedAt { get; set; }
    public DateTime NotifiedAt { get; set; }
    public Status Status { get; set; }
    
    public User User { get; set; }
    public Car Car { get; set; }
}