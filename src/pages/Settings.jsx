import React from "react";
import cancelIcon from "../assets/cancel-white.png";

function Settings({ onBack }) {
  return (
    <div className="chatContent" style={{padding: "20px"}}>
        <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
            <p style={{fontWeight: 500, color: "gray", fontSize: "20px"}}>Інструкція:</p>
            <button onClick={onBack} className="inputButton">
                <img className="iconButton" src={cancelIcon} alt="Cancel"/>
            </button>
        </div>
        <div style={{backgroundColor: "#A71A22", padding: "15px", borderRadius: "8px", marginTop: "20px", color: "white", fontFamily: 'Inter, sans-serif', lineHeight: "1.5"}}>
            <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tenetur molestiae quos consequuntur nihil expedita modi necessitatibus fugit vero dolorem fuga, libero numquam alias possimus impedit harum facere dolores eaque architecto quia rem laboriosam minus reprehenderit, in voluptates? Similique neque sint repudiandae nemo ex voluptatem in pariatur minus adipisci iure. Laboriosam eligendi itaque minima incidunt inventore atque corrupti doloribus commodi excepturi neque fuga repellat quibusdam pariatur voluptate in, ratione magni magnam nemo vero labore distinctio vel praesentium? Tempore optio quos libero, iure modi hic laudantium exercitationem distinctio itaque unde repellendus quidem quibusdam esse tempora, laborum consectetur similique blanditiis ab, officiis pariatur.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "space-between", marginTop: "20px" }}>
            <p style={{fontWeight: 500, color: "gray", fontSize: "20px"}}>Приклади використання:</p>
        </div>
        <div style={{backgroundColor: "#A71A22", padding: "15px", borderRadius: "8px", marginTop: "20px", color: "white", fontFamily: 'Inter, sans-serif', lineHeight: "1.5"}}>
            <p>Lorem ipsum dolor sit, amet consectetur adipisicing elit. Vero ab pariatur laborum nihil repudiandae maiores suscipit labore asperiores perferendis. Explicabo, ratione. Libero pariatur nisi error quos distinctio deserunt, quo dolor, animi obcaecati eius nam, odio necessitatibus quam cumque eaque! Iure, veritatis quae. Tempore blanditiis ratione libero distinctio labore nihil quisquam, consectetur, commodi sint explicabo optio voluptates repellendus quia placeat soluta quaerat deserunt officia mollitia iure vitae debitis ut! Maxime quos obcaecati fugit esse molestias facilis, asperiores sequi velit amet soluta exercitationem optio pariatur perspiciatis illo culpa doloremque est vel iusto perferendis mollitia adipisci dicta doloribus! Voluptate nostrum inventore ipsum, dolorum doloremque dignissimos itaque eius numquam deleniti odio exercitationem eaque quaerat explicabo quas incidunt molestias distinctio, nesciunt beatae. Alias numquam, aspernatur error qui sint harum quisquam soluta, architecto nesciunt repellat perspiciatis aliquid aliquam, quis temporibus eligendi optio reprehenderit odit nostrum voluptatum! Labore magnam beatae natus, expedita, error culpa ipsum et non, sint vel cupiditate accusantium consectetur molestias deleniti doloremque dolorum asperiores unde eos nam delectus? Officia ducimus ut adipisci facilis facere. Expedita aut quae in itaque, ea delectus rem aliquid sapiente ratione voluptatum deserunt assumenda, dolores quos facere qui dolorem culpa suscipit cum illum hic facilis! Beatae perferendis laboriosam sed ducimus! Repudiandae error et praesentium, ducimus iusto id ex eum dicta esse eveniet cupiditate possimus maiores consequatur totam neque perspiciatis quaerat nulla. Blanditiis suscipit quasi facere laudantium maxime, dolorum exercitationem mollitia recusandae ipsum provident optio consequatur ipsa dolore culpa sunt beatae voluptatibus quas deleniti dignissimos fuga eius nulla voluptate sit nam?</p>
        </div>
    </div>
  );
}

export default Settings;
