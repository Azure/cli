using System;

namespace ExternlaLibrary.Standard
{
    public class Person
    {
        public Guid Id => Guid.NewGuid();
        public string Name => "John Smith";
        public string Email => "john.smith@electron-quick-start.com";

    }

    public class Library
    {
        public Person GetPerson()
        {
            return new Person();
        }
    }
}